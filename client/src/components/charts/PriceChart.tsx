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
}: Props) {
  const [rangeId, setRangeId] = useState(defaultRange);
  const [series, setSeries] = useState<HistorySeries | null>(null);
  const [points, setPoints] = useState<HistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hover, setHover] = useState<{ i: number; x: number; y: number } | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

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
        setPoints(data.points ?? []);
      })
      .catch((err: unknown) => {
        if ((err as Error)?.name === 'AbortError') return;
        setError('Grafik verisi alınamadı');
      })
      .finally(() => setLoading(false));

    return () => ac.abort();
  }, [instrument, preset.interval, preset.range]);

  // ── 2) Canlı son mum ───────────────────────────────────────────
  useEffect(() => {
    if (!live) return;
    // Saatlik ve günlük görünümlerde anlamlı; haftalık+ periyotlarda da son mum
    // güncellenebilir ama etkisi görsel olarak minimal — yine de bağlanıyoruz.
    const unsubscribe = subscribeHistory(instrument, (bar, barInterval) => {
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
  }, [instrument, live, preset.interval]);

  // ── Çizim geometrisi ───────────────────────────────────────────
  const W = 800;
  const H = height;
  const PAD = { top: 16, right: 56, bottom: 28, left: 8 };

  const geom = useMemo(() => {
    if (points.length === 0) return null;
    const values = points.map((p) => p.c);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = max - min || max || 1;
    const pad = span * 0.08;
    const lo = min - pad;
    const hi = max + pad;

    const innerW = W - PAD.left - PAD.right;
    const innerH = H - PAD.top - PAD.bottom;
    const x = (i: number) =>
      PAD.left + (points.length === 1 ? innerW / 2 : (i / (points.length - 1)) * innerW);
    const y = (v: number) => PAD.top + innerH - ((v - lo) / (hi - lo)) * innerH;

    const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(2)},${y(p.c).toFixed(2)}`).join(' ');
    const area = `${line} L${x(points.length - 1).toFixed(2)},${(H - PAD.bottom).toFixed(2)} L${x(0).toFixed(
      2,
    )},${(H - PAD.bottom).toFixed(2)} Z`;

    // 4 yatay ızgara çizgisi
    const ticks = Array.from({ length: 5 }, (_, k) => {
      const v = lo + ((hi - lo) * k) / 4;
      return { v, y: y(v) };
    });

    return { x, y, line, area, lo, hi, ticks, innerW, innerH };
  }, [points, H, W, PAD.left, PAD.right, PAD.top, PAD.bottom]);

  const first = points[0]?.c ?? 0;
  const last = points[points.length - 1]?.c ?? 0;
  const change = first ? ((last - first) / first) * 100 : 0;
  const up = change >= 0;
  const stroke = up ? '#10b981' : '#f43f5e';

  const onMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!geom || points.length === 0 || !svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      const px = ((e.clientX - rect.left) / rect.width) * W;
      const ratio = (px - PAD.left) / (W - PAD.left - PAD.right);
      const i = Math.round(ratio * (points.length - 1));
      const idx = Math.max(0, Math.min(points.length - 1, i));
      setHover({ i: idx, x: geom.x(idx), y: geom.y(points[idx].c) });
    },
    [geom, points, PAD.left, PAD.right],
  );

  return (
    <div className={`rounded-xl border border-border bg-card p-4 ${className}`}>
      {/* Başlık + değişim */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm text-muted-foreground">{series?.label ?? instrument}</div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-semibold tabular-nums">
              {last ? formatPrice(last, decimals) : '—'}
            </span>
            {points.length > 1 && (
              <span className={`text-sm font-medium ${up ? 'text-emerald-500' : 'text-rose-500'}`}>
                {up ? '▲' : '▼'} %{Math.abs(change).toFixed(2)}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-1" role="group" aria-label="Zaman aralığı">
          {RANGE_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setRangeId(p.id)}
              aria-pressed={p.id === rangeId}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                p.id === rangeId
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grafik */}
      <div className="relative" style={{ height }}>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
            Yükleniyor…
          </div>
        )}
        {error && !loading && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
            {error}
          </div>
        )}
        {!loading && !error && points.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
            Bu aralık için veri yok
          </div>
        )}

        {geom && points.length > 0 && (
          <svg
            ref={svgRef}
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="none"
            className="h-full w-full"
            onMouseMove={onMove}
            onMouseLeave={() => setHover(null)}
            role="img"
            aria-label={`${series?.label ?? instrument} fiyat grafiği`}
          >
            <defs>
              <linearGradient id={`grad-${up ? 'up' : 'down'}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={stroke} stopOpacity="0.22" />
                <stop offset="100%" stopColor={stroke} stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Izgara + fiyat ekseni */}
            {geom.ticks.map((t) => (
              <g key={t.v}>
                <line
                  x1={PAD.left}
                  x2={W - PAD.right}
                  y1={t.y}
                  y2={t.y}
                  stroke="currentColor"
                  strokeOpacity="0.08"
                  strokeWidth="1"
                />
                <text
                  x={W - PAD.right + 6}
                  y={t.y + 4}
                  fontSize="11"
                  fill="currentColor"
                  fillOpacity="0.55"
                  className="tabular-nums"
                >
                  {formatPrice(t.v, decimals)}
                </text>
              </g>
            ))}

            <path d={geom.area} fill={`url(#grad-${up ? 'up' : 'down'})`} />
            <path d={geom.line} fill="none" stroke={stroke} strokeWidth="2" vectorEffect="non-scaling-stroke" />

            {/* İmleç */}
            {hover && (
              <g>
                <line
                  x1={hover.x}
                  x2={hover.x}
                  y1={PAD.top}
                  y2={H - PAD.bottom}
                  stroke="currentColor"
                  strokeOpacity="0.25"
                  strokeDasharray="3 3"
                />
                <circle cx={hover.x} cy={hover.y} r="4" fill={stroke} stroke="var(--background, #fff)" strokeWidth="2" />
              </g>
            )}

            {/* Zaman ekseni — 4 etiket */}
            {[0, Math.floor(points.length / 3), Math.floor((2 * points.length) / 3), points.length - 1]
              .filter((i, k, arr) => arr.indexOf(i) === k && points[i])
              .map((i) => (
                <text
                  key={i}
                  x={geom.x(i)}
                  y={H - 8}
                  fontSize="11"
                  fill="currentColor"
                  fillOpacity="0.55"
                  textAnchor={i === 0 ? 'start' : i === points.length - 1 ? 'end' : 'middle'}
                >
                  {formatDate(points[i].t, preset.interval)}
                </text>
              ))}
          </svg>
        )}

        {/* Tooltip */}
        {hover && points[hover.i] && (
          <div
            className="pointer-events-none absolute rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-lg"
            style={{
              left: `min(calc(${(hover.x / W) * 100}% + 8px), calc(100% - 140px))`,
              top: 8,
            }}
          >
            <div className="text-muted-foreground">{formatDate(points[hover.i].t, preset.interval)}</div>
            <div className="font-semibold tabular-nums">{formatPrice(points[hover.i].c, decimals)}</div>
            {points[hover.i].h !== null && points[hover.i].l !== null && (
              <div className="text-muted-foreground tabular-nums">
                Y {formatPrice(points[hover.i].h!, decimals)} · D {formatPrice(points[hover.i].l!, decimals)}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Kaynak bilgisi — hangi seriyi gösterdiğimiz her zaman açık olsun */}
      {series && (
        <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>
            Kaynak: {series.source} · {series.count} veri noktası
          </span>
          {series.live && <span className="text-emerald-500">● canlı</span>}
        </div>
      )}
    </div>
  );
}
