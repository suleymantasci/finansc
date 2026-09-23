'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  fetchHistory,
  subscribeHistory,
  RANGE_PRESETS,
  type HistoryPoint,
  type HistorySeries,
} from '@/lib/history';

/**
 * Fiyat grafiği — bağımlılıksız SVG.
 *
 * Çalışma deseni (snapshot + artımlı güncelleme):
 *  1. Seçilen aralık için TEK istek atılır, tüm seri gelir.
 *  2. SSE açılır; sadece son mum güncellenir, seri yeniden çekilmez.
 *  3. Aralık değişince yeni snapshot alınır, SSE açık kalır.
 *
 * Harici grafik kütüphanesi eklemedik: seri tek boyutlu ve çizim basit,
 * bundle'a 40-80 KB eklemeye değmez.
 */

interface Props {
  instrument: string;
  /** Başlangıç aralığı (RANGE_PRESETS id'si) */
  defaultRange?: string;
  /** Fiyat biçimi için ondalık */
  decimals?: number;
  /** Canlı akışı aç (borsa kapalıyken de zararsız) */
  live?: boolean;
  height?: number;
  className?: string;
  /** Kaynak serinin kotasyon birimi (ör. JPY100 → 100); değerler buna bölünür */
  scale?: number;
}

function formatPrice(v: number, decimals: number): string {
  return v.toLocaleString('tr-TR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function formatDate(t: string, interval: string): string {
  const d = new Date(t.length <= 10 ? `${t}T00:00:00` : t);
  if (Number.isNaN(d.getTime())) return t;
  if (interval === '1h') {
    return d.toLocaleString('tr-TR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  }
  if (interval === '1y') return String(d.getFullYear());
  if (interval === '1mo') return d.toLocaleDateString('tr-TR', { month: 'short', year: 'numeric' });
  return d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: '2-digit' });
}

export function PriceChart({
  instrument,
  defaultRange = '1y',
  decimals = 2,
  live = true,
  height = 320,
  className = '',
  scale = 1,
}: Props) {
  const [rangeId, setRangeId] = useState(defaultRange);
  const [series, setSeries] = useState<HistorySeries | null>(null);
  const [points, setPoints] = useState<HistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hover, setHover] = useState<{ i: number; x: number; y: number } | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const boxRef = useRef<HTMLDivElement | null>(null);

  // Genişliği ölçüyoruz: sabit viewBox + preserveAspectRatio="none" dar
  // ekranda yazıları yatayda eziyordu. Ölçülen genişlikle çizince
  // her ekran boyutunda oranlar doğru kalıyor.
  const [width, setWidth] = useState(800);
  useEffect(() => {
    const el = boxRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w && Math.abs(w - width) > 1) setWidth(Math.max(280, Math.round(w)));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [width]);

  const preset = useMemo(
    () => RANGE_PRESETS.find((p) => p.id === rangeId) ?? RANGE_PRESETS[3],
    [rangeId],
  );

  // ── 1) Snapshot ────────────────────────────────────────────────
  useEffect(() => {
    const ac = new AbortController();
    setLoading(true);
    setError(null);

    fetchHistory(instrument, { interval: preset.interval, range: preset.range, signal: ac.signal })
      .then((data) => {
        setSeries(data);
        setPoints(
          scale === 1
            ? data.points ?? []
            : (data.points ?? []).map((p) => ({
                ...p,
                o: p.o == null ? null : p.o / scale,
                h: p.h == null ? null : p.h / scale,
                l: p.l == null ? null : p.l / scale,
                c: p.c / scale,
              })),
        );
      })
      .catch((err: unknown) => {
        if ((err as Error)?.name === 'AbortError') return;
        setError('Grafik verisi alınamadı');
      })
      .finally(() => setLoading(false));

    return () => ac.abort();
  }, [instrument, preset.interval, preset.range, scale]);

  // ── 2) Canlı son mum ───────────────────────────────────────────
  useEffect(() => {
    if (!live) return;
    // Saatlik ve günlük görünümlerde anlamlı; haftalık+ periyotlarda da son mum
    // güncellenebilir ama etkisi görsel olarak minimal — yine de bağlanıyoruz.
    const unsubscribe = subscribeHistory(instrument, (raw, barInterval) => {
      const bar = scale === 1 ? raw : { ...raw, o: raw.o / scale, h: raw.h / scale, l: raw.l / scale, c: raw.c / scale };
      setPoints((prev) => {
        if (prev.length === 0) return prev;
        const wantHourly = preset.interval === '1h';
        if (wantHourly !== (barInterval === '1h')) {
          // Periyot eşleşmiyorsa sadece son mumun kapanışını güncelle
          const copy = [...prev];
          const last = { ...copy[copy.length - 1] };
          last.c = bar.c;
          last.h = Math.max(last.h ?? bar.c, bar.c);
          last.l = Math.min(last.l ?? bar.c, bar.c);
          copy[copy.length - 1] = last;
          return copy;
        }
        const copy = [...prev];
        const lastIdx = copy.length - 1;
        if (copy[lastIdx]?.t === bar.t) {
          copy[lastIdx] = { ...copy[lastIdx], h: bar.h, l: bar.l, c: bar.c, v: bar.v };
        } else {
          copy.push({ t: bar.t, o: bar.o, h: bar.h, l: bar.l, c: bar.c, v: bar.v });
        }
        return copy;
      });
    });
    return unsubscribe;
  }, [instrument, live, preset.interval, scale]);

  // ── Çizim geometrisi ───────────────────────────────────────────
  const [mode, setMode] = useState<'area' | 'candle'>('area');
  const hasVolume = points.some((p) => (p.v ?? 0) > 0);
  const hasOhlc = points.some((p) => p.h != null && p.l != null && p.h !== p.l);
  const W = width;
  const H = height;
  const VOL_H = hasVolume ? Math.round(H * 0.16) : 0;
  const PAD = { top: 14, right: 64, bottom: 26, left: 4 };

  const geom = useMemo(() => {
    if (points.length === 0) return null;
    const hiVals = points.map((p) => (mode === 'candle' ? p.h ?? p.c : p.c));
    const loVals = points.map((p) => (mode === 'candle' ? p.l ?? p.c : p.c));
    const min = Math.min(...loVals);
    const max = Math.max(...hiVals);
    const span = max - min || max || 1;
    const pad = span * 0.08;
    const lo = min - pad;
    const hi = max + pad;

    const innerW = W - PAD.left - PAD.right;
    const priceBottom = H - PAD.bottom - VOL_H;
    const innerH = priceBottom - PAD.top;
    const x = (i: number) =>
      PAD.left + (points.length === 1 ? innerW / 2 : (i / (points.length - 1)) * innerW);
    const y = (v: number) => PAD.top + innerH - ((v - lo) / (hi - lo)) * innerH;

    const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(2)},${y(p.c).toFixed(2)}`).join(' ');
    const area = `${line} L${x(points.length - 1).toFixed(2)},${priceBottom.toFixed(2)} L${x(0).toFixed(2)},${priceBottom.toFixed(2)} Z`;
    const ticks = Array.from({ length: 5 }, (_, k) => {
      const v = lo + ((hi - lo) * k) / 4;
      return { v, y: y(v) };
    });
    const vMax = Math.max(1, ...points.map((p) => p.v ?? 0));
    const slot = innerW / Math.max(1, points.length);
    return { x, y, line, area, lo, hi, ticks, innerW, innerH, priceBottom, vMax, slot };
  }, [points, H, W, VOL_H, mode, PAD.left, PAD.right, PAD.top, PAD.bottom]);

  const first = points[0]?.c ?? 0;
  const last = points[points.length - 1]?.c ?? 0;
  const change = first ? ((last - first) / first) * 100 : 0;
  const up = change >= 0;
  const stroke = 'var(--color-primary)';
  const gradId = `pc-grad-${instrument.replace(/[^a-z0-9]/gi, '')}`;

  const moveTo = useCallback(
    (clientX: number) => {
      if (!geom || points.length === 0 || !svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      const px = ((clientX - rect.left) / rect.width) * W;
      const ratio = (px - PAD.left) / (W - PAD.left - PAD.right);
      const i = Math.round(ratio * (points.length - 1));
      const idx = Math.max(0, Math.min(points.length - 1, i));
      setHover({ i: idx, x: geom.x(idx), y: geom.y(points[idx].c) });
    },
    [geom, points, PAD.left, PAD.right, W],
  );

  const tabBtn = (active: boolean) =>
    `num h-8 min-w-10 rounded-lg px-2.5 text-[12px] font-medium transition-colors ${
      active ? 'border border-primary/60 bg-primary/10 text-foreground' : 'text-muted-foreground hover:bg-surface-hover hover:text-foreground'
    }`;

  return (
    <div className={`atlas-card p-4 sm:p-5 ${className}`}>
      {/* Araç çubuğu: aralık + grafik türü */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1" role="group" aria-label="Zaman aralığı">
          {RANGE_PRESETS.map((p) => (
            <button key={p.id} type="button" onClick={() => setRangeId(p.id)} aria-pressed={p.id === rangeId} className={tabBtn(p.id === rangeId)}>
              {p.label}
            </button>
          ))}
        </div>
        {hasOhlc && (
          <div className="flex gap-1 rounded-lg border border-border p-0.5" role="group" aria-label="Grafik türü">
            <button type="button" aria-pressed={mode === 'area'} onClick={() => setMode('area')} className={tabBtn(mode === 'area')}>
              Alan
            </button>
            <button type="button" aria-pressed={mode === 'candle'} onClick={() => setMode('candle')} className={tabBtn(mode === 'candle')}>
              Mum
            </button>
          </div>
        )}
      </div>

      <div className="mb-2 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-[13px]">
        <span className="text-foreground/90">{series?.label ?? instrument}</span>
        <span className="text-muted-foreground">· {preset.label}</span>
        {points.length > 1 && (
          <span className={`num font-medium ${up ? 'text-up' : 'text-down'}`}>
            {formatPrice(last, decimals)} ({up ? '+' : '-'}%{Math.abs(change).toFixed(2).replace('.', ',')})
          </span>
        )}
      </div>

      {/* Grafik */}
      <div ref={boxRef} className="relative touch-pan-y" style={{ height }}>
        {loading && <div className="skeleton-shimmer absolute inset-0 rounded-lg" aria-hidden="true" />}
        {error && !loading && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">{error}</div>
        )}
        {!loading && !error && points.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
            Bu aralık için veri yok — başka bir aralık seçin
          </div>
        )}

        {geom && points.length > 0 && !loading && (
          <svg
            ref={svgRef}
            viewBox={`0 0 ${W} ${H}`}
            className="h-full w-full text-muted-foreground"
            onMouseMove={(e) => moveTo(e.clientX)}
            onMouseLeave={() => setHover(null)}
            onTouchStart={(e) => moveTo(e.touches[0].clientX)}
            onTouchMove={(e) => moveTo(e.touches[0].clientX)}
            onTouchEnd={() => setHover(null)}
            role="img"
            aria-label={`${series?.label ?? instrument} ${preset.label} fiyat grafiği: ilk ${formatPrice(first, decimals)}, son ${formatPrice(last, decimals)}`}
          >
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={stroke} stopOpacity="0.32" />
                <stop offset="100%" stopColor={stroke} stopOpacity="0" />
              </linearGradient>
            </defs>

            {geom.ticks.map((t) => (
              <g key={t.v}>
                <line x1={PAD.left} x2={W - PAD.right} y1={t.y} y2={t.y} stroke="var(--color-border)" strokeDasharray="2 4" />
                {/* Son fiyat etiketine çok yakın eksen değerini gizle (çakışmasın) */}
                {Math.abs(t.y - geom.y(last)) > 14 && (
                  <text x={W - PAD.right + 8} y={t.y + 4} fontSize="11" fill="currentColor" className="num">
                    {formatPrice(t.v, decimals)}
                  </text>
                )}
              </g>
            ))}

            {mode === 'area' ? (
              <>
                <path d={geom.area} fill={`url(#${gradId})`} />
                <path d={geom.line} fill="none" stroke={stroke} strokeWidth="1.8" strokeLinejoin="round" />
              </>
            ) : (
              points.map((p, i) => {
                const o = p.o ?? (i > 0 ? points[i - 1].c : p.c);
                const h = Math.max(p.h ?? p.c, o, p.c);
                const l = Math.min(p.l ?? p.c, o, p.c);
                const green = p.c >= o;
                const col = green ? 'var(--color-up)' : 'var(--color-down)';
                const cx = geom.x(i);
                const bw = Math.max(1.5, geom.slot * 0.6);
                return (
                  <g key={p.t}>
                    <line x1={cx} x2={cx} y1={geom.y(h)} y2={geom.y(l)} stroke={col} strokeWidth="1" />
                    <rect x={cx - bw / 2} y={geom.y(Math.max(o, p.c))} width={bw} height={Math.max(1, Math.abs(geom.y(o) - geom.y(p.c)))} fill={col} />
                  </g>
                );
              })
            )}

            {/* Hacim çubukları */}
            {hasVolume &&
              points.map((p, i) => {
                const vh = ((p.v ?? 0) / geom.vMax) * (VOL_H - 6);
                const prev = i > 0 ? points[i - 1].c : p.c;
                return (
                  <rect
                    key={`v-${p.t}`}
                    x={geom.x(i) - Math.max(1, geom.slot * 0.35)}
                    y={H - PAD.bottom - vh}
                    width={Math.max(1.5, geom.slot * 0.7)}
                    height={vh}
                    fill={p.c >= prev ? 'var(--color-up)' : 'var(--color-down)'}
                    opacity="0.45"
                  />
                );
              })}

            {/* Son fiyat etiketi */}
            <line x1={PAD.left} x2={W - PAD.right} y1={geom.y(last)} y2={geom.y(last)} stroke={stroke} strokeOpacity="0.5" strokeDasharray="3 3" />
            <rect x={W - PAD.right + 2} y={geom.y(last) - 10} width={PAD.right - 4} height={20} rx="4" fill={stroke} />
            <text x={W - PAD.right + PAD.right / 2} y={geom.y(last) + 4} fontSize="11" textAnchor="middle" fill="var(--color-primary-foreground)" className="num font-semibold">
              {formatPrice(last, decimals)}
            </text>

            {hover && (
              <g>
                <line x1={hover.x} x2={hover.x} y1={PAD.top} y2={H - PAD.bottom} stroke="var(--color-border-strong)" strokeDasharray="3 3" />
                <circle cx={hover.x} cy={hover.y} r="4" fill={stroke} stroke="var(--color-card)" strokeWidth="2" />
              </g>
            )}

            {[0, Math.floor(points.length / 3), Math.floor((2 * points.length) / 3), points.length - 1]
              .filter((i, k, arr) => arr.indexOf(i) === k && points[i])
              .map((i) => (
                <text
                  key={i}
                  x={geom.x(i)}
                  y={H - 8}
                  fontSize="11"
                  fill="currentColor"
                  textAnchor={i === 0 ? 'start' : i === points.length - 1 ? 'end' : 'middle'}
                >
                  {formatDate(points[i].t, preset.interval)}
                </text>
              ))}
          </svg>
        )}

        {hover && points[hover.i] && (
          <div
            className="pointer-events-none absolute rounded-lg border border-border bg-elevated px-3 py-2 text-xs shadow-xl"
            style={{ left: `min(calc(${(hover.x / W) * 100}% + 10px), calc(100% - 160px))`, top: 8 }}
          >
            <div className="text-muted-foreground">{formatDate(points[hover.i].t, preset.interval)}</div>
            <div className="num text-sm font-semibold text-foreground">{formatPrice(points[hover.i].c, decimals)}</div>
            {points[hover.i].h !== null && points[hover.i].l !== null && (
              <div className="num text-muted-foreground">
                Y {formatPrice(points[hover.i].h!, decimals)} · D {formatPrice(points[hover.i].l!, decimals)}
              </div>
            )}
            {(points[hover.i].v ?? 0) > 0 && (
              <div className="num text-muted-foreground">Hacim {new Intl.NumberFormat('tr-TR', { notation: 'compact' }).format(points[hover.i].v!)}</div>
            )}
          </div>
        )}
      </div>

      {series && (
        <p className="mt-3 text-[11px] text-muted-foreground">
          Kaynak: {series.source} · {series.count} veri noktası · {preset.interval === '1h' ? 'saatlik' : preset.interval === '1d' ? 'günlük' : preset.interval === '1w' ? 'haftalık' : 'aylık'} kapanışlar
        </p>
      )}
    </div>
  );
}
