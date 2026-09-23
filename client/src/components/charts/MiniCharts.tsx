'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { pctTr } from '@/lib/formatters';
import { cn } from '@/lib/utils';

/**
 * Ana sayfa mini grafikleri — bağımlılıksız SVG.
 * SVG sanal koordinatlarda çizilir (preserveAspectRatio="none"), eksen
 * etiketleri bozulmasın diye HTML olarak üstüne konur.
 */

export interface SeriesPoint {
  t: string;
  c: number;
  o?: number | null;
  h?: number | null;
  l?: number | null;
}

const W = 600;

function extent(values: number[], padRatio = 0.08): [number, number] {
  let min = Infinity;
  let max = -Infinity;
  for (const v of values) {
    if (v < min) min = v;
    if (v > max) max = v;
  }
  if (!Number.isFinite(min)) return [0, 1];
  if (min === max) return [min - 1, max + 1];
  const pad = (max - min) * padRatio;
  return [min - pad, max + pad];
}

function pathFor(values: number[], h: number, [min, max]: [number, number]): string {
  if (values.length === 0) return '';
  const step = values.length > 1 ? W / (values.length - 1) : 0;
  return values
    .map((v, i) => {
      const x = i * step;
      const y = h - ((v - min) / (max - min)) * h;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join('');
}

function fmt(v: number, decimals: number) {
  return v.toLocaleString('tr-TR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function fmtDay(t: string) {
  const d = new Date(t.length <= 10 ? `${t}T00:00:00` : t);
  if (Number.isNaN(d.getTime())) return t;
  return d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ── Sparkline ──────────────────────────────────────────────────────

export function Sparkline({
  values,
  color = 'var(--color-up)',
  height = 40,
  fill = true,
  className,
}: {
  values: number[];
  color?: string;
  height?: number;
  fill?: boolean;
  className?: string;
}) {
  const id = useId();
  const dom = useMemo(() => extent(values, 0.12), [values]);
  const d = useMemo(() => pathFor(values, height, dom), [values, height, dom]);
  if (values.length < 2) {
    return <div className={cn('skeleton-shimmer rounded', className)} style={{ height }} aria-hidden="true" />;
  }
  return (
    <svg
      viewBox={`0 0 ${W} ${height}`}
      preserveAspectRatio="none"
      className={cn('block w-full overflow-visible', className)}
      style={{ height }}
      aria-hidden="true"
    >
      {fill && (
        <>
          <defs>
            <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.28" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={`${d}L${W},${height}L0,${height}Z`} fill={`url(#${id})`} />
        </>
      )}
      <path d={d} fill="none" stroke={color} strokeWidth="1.6" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
    </svg>
  );
}

// ── Alan grafiği (eksenli + hover) ────────────────────────────────

export function AreaChart({
  points,
  color = 'var(--color-primary)',
  height = 180,
  decimals = 2,
  label,
}: {
  points: SeriesPoint[];
  color?: string;
  height?: number;
  decimals?: number;
  /** Ekran okuyucu özeti */
  label: string;
}) {
  const id = useId();
  const ref = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<number | null>(null);
  const values = useMemo(() => points.map((p) => p.c), [points]);
  const dom = useMemo(() => extent(values), [values]);
  const d = useMemo(() => pathFor(values, height, dom), [values, height, dom]);

  const ticks = useMemo(() => {
    const [min, max] = dom;
    return [0.15, 0.5, 0.85].map((r) => ({ r, v: max - (max - min) * r }));
  }, [dom]);

  if (points.length < 2) {
    return <div className="skeleton-shimmer rounded-lg" style={{ height }} aria-hidden="true" />;
  }

  const first = values[0];
  const last = values[values.length - 1];
  const hi = hover != null ? points[hover] : null;
  const hx = hover != null ? (hover / (points.length - 1)) * 100 : 0;
  const hy = hi ? 100 - ((hi.c - dom[0]) / (dom[1] - dom[0])) * 100 : 0;

  function onMove(e: React.PointerEvent<HTMLDivElement>) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    setHover(Math.round(ratio * (points.length - 1)));
  }

  return (
    <figure className="relative m-0">
      <figcaption className="sr-only">
        {label}: {fmtDay(points[0].t)} tarihinde {fmt(first, decimals)}, {fmtDay(points[points.length - 1].t)} tarihinde{' '}
        {fmt(last, decimals)}.
      </figcaption>
      <div
        ref={ref}
        className="relative touch-pan-y pr-14"
        style={{ height }}
        onPointerMove={onMove}
        onPointerLeave={() => setHover(null)}
      >
        <svg viewBox={`0 0 ${W} ${height}`} preserveAspectRatio="none" className="block h-full w-full overflow-visible" aria-hidden="true">
          <defs>
            <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.35" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          {ticks.map((t) => (
            <line
              key={t.r}
              x1="0"
              x2={W}
              y1={t.r * height}
              y2={t.r * height}
              stroke="var(--color-border)"
              strokeDasharray="2 4"
              vectorEffect="non-scaling-stroke"
            />
          ))}
          <path d={`${d}L${W},${height}L0,${height}Z`} fill={`url(#${id})`} />
          <path d={d} fill="none" stroke={color} strokeWidth="1.8" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
        </svg>
        {/* Y ekseni etiketleri */}
        <div className="pointer-events-none absolute inset-y-0 right-0 w-14" aria-hidden="true">
          {ticks.map((t) => (
            <span
              key={t.r}
              className="num absolute right-0 -translate-y-1/2 text-[10px] text-muted-foreground"
              style={{ top: `${t.r * 100}%` }}
            >
              {fmt(t.v, t.v > 1000 ? 0 : decimals)}
            </span>
          ))}
        </div>
        {/* Hover göstergesi */}
        {hi && (
          <div className="pointer-events-none absolute inset-y-0 left-0 right-14" aria-hidden="true">
            <div className="absolute inset-y-0 w-px bg-border-strong" style={{ left: `${hx}%` }} />
            <div
              className="absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background"
              style={{ left: `${hx}%`, top: `${hy}%`, background: color }}
            />
            <div
              className={cn(
                'absolute top-0 rounded-md border border-border bg-elevated px-2 py-1 text-[11px] shadow-lg whitespace-nowrap',
                hx > 60 ? '-translate-x-[calc(100%+8px)]' : 'translate-x-2',
              )}
              style={{ left: `${hx}%` }}
            >
              <span className="num font-semibold text-foreground">{fmt(hi.c, decimals)}</span>
              <span className="ml-1.5 text-muted-foreground">{fmtDay(hi.t)}</span>
            </div>
          </div>
        )}
      </div>
    </figure>
  );
}

// ── Mum grafik ─────────────────────────────────────────────────────

export function CandleChart({
  points,
  height = 180,
  decimals = 2,
  label,
}: {
  points: SeriesPoint[];
  height?: number;
  decimals?: number;
  label: string;
}) {
  // Açılış verisi olmayan barlarda (endeksler) bir önceki kapanışı açılış say
  const candles = useMemo(
    () =>
      points.map((p, i) => {
        const o = p.o ?? (i > 0 ? points[i - 1].c : p.c);
        const h = Math.max(p.h ?? p.c, o, p.c);
        const l = Math.min(p.l ?? p.c, o, p.c);
        return { t: p.t, o, h, l, c: p.c };
      }),
    [points],
  );
  const dom = useMemo(() => extent(candles.flatMap((c) => [c.h, c.l]), 0.06), [candles]);
  const ticks = useMemo(() => {
    const [min, max] = dom;
    return [0.1, 0.5, 0.9].map((r) => ({ r, v: max - (max - min) * r }));
  }, [dom]);

  if (candles.length < 2) {
    return <div className="skeleton-shimmer rounded-lg" style={{ height }} aria-hidden="true" />;
  }

  const y = (v: number) => height - ((v - dom[0]) / (dom[1] - dom[0])) * height;
  const slot = W / candles.length;
  const body = Math.max(2, slot * 0.56);
  const first = candles[0];
  const last = candles[candles.length - 1];

  return (
    <figure className="relative m-0">
      <figcaption className="sr-only">
        {label}: {fmtDay(first.t)} kapanış {fmt(first.c, decimals)}, {fmtDay(last.t)} kapanış {fmt(last.c, decimals)}.
      </figcaption>
      <div className="relative pr-14" style={{ height }}>
        <svg viewBox={`0 0 ${W} ${height}`} preserveAspectRatio="none" className="block h-full w-full" aria-hidden="true">
          {ticks.map((t) => (
            <line
              key={t.r}
              x1="0"
              x2={W}
              y1={t.r * height}
              y2={t.r * height}
              stroke="var(--color-border)"
              strokeDasharray="2 4"
              vectorEffect="non-scaling-stroke"
            />
          ))}
          {candles.map((c, i) => {
            const up = c.c >= c.o;
            const color = up ? 'var(--color-up)' : 'var(--color-down)';
            const cx = i * slot + slot / 2;
            const top = y(Math.max(c.o, c.c));
            const bh = Math.max(1.5, Math.abs(y(c.o) - y(c.c)));
            return (
              <g key={c.t}>
                <line x1={cx} x2={cx} y1={y(c.h)} y2={y(c.l)} stroke={color} strokeWidth="1" vectorEffect="non-scaling-stroke" />
                <rect x={cx - body / 2} y={top} width={body} height={bh} fill={color} rx="0.5" />
              </g>
            );
          })}
        </svg>
        <div className="pointer-events-none absolute inset-y-0 right-0 w-14" aria-hidden="true">
          {ticks.map((t) => (
            <span
              key={t.r}
              className="num absolute right-0 -translate-y-1/2 text-[10px] text-muted-foreground"
              style={{ top: `${t.r * 100}%` }}
            >
              {fmt(t.v, 0)}
            </span>
          ))}
        </div>
      </div>
    </figure>
  );
}

// ── Gün içi aralık çubuğu (düşük ─●─ yüksek) ─────────────────────

export function RangeBar({ low, high, value }: { low: number; high: number; value: number }) {
  const pos = high > low ? Math.min(100, Math.max(0, ((value - low) / (high - low)) * 100)) : 50;
  return (
    <div className="relative h-1 w-full rounded-full bg-border" aria-hidden="true">
      <div
        className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-down/60 via-muted-foreground/40 to-up/60"
        style={{ width: '100%' }}
      />
      <div
        className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-card bg-foreground"
        style={{ left: `${pos}%` }}
      />
    </div>
  );
}

// ── Karşılaştırma grafiği: varlık yıllık getirisi vs enflasyon ─────
// Gerçek piksel koordinatlarında çizilir (ResizeObserver) — metin ve çizgiler esnemez.

export interface CompareRow {
  /** "MM-YYYY" */
  period: string;
  asset: number;
  inflation: number;
}

const MONTHS_TR = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

function niceTicks(min: number, max: number, target = 4): number[] {
  const span = max - min || 1;
  const raw = span / target;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((st) => span / st <= target + 1) ?? 10 * mag;
  // Alt sınır aşağı, üst sınır yukarı yuvarlanır — veri eksen dışına taşmaz
  const start = Math.floor(min / step) * step;
  const end = Math.ceil(max / step) * step;
  const out: number[] = [];
  for (let v = start; v <= end + 1e-9; v += step) out.push(Math.round(v * 100) / 100);
  return out;
}

const pct = (v: number) => pctTr(v, { digits: 1 });

export function CompareChart({
  rows,
  assetLabel,
  height = 190,
  label,
}: {
  rows: CompareRow[];
  assetLabel: string;
  height?: number;
  label: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [hover, setHover] = useState<number | null>(null);
  const ready = rows.length >= 2;

  // İskelet → grafik geçişinde farklı eleman; gözlemciyi yeniden bağla
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(Math.round(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, [ready]);

  const pad = { l: 40, r: 12, t: 10, b: 24 };
  const iw = Math.max(0, width - pad.l - pad.r);
  const ih = height - pad.t - pad.b;

  const { ticks, lo, hi } = useMemo(() => {
    if (rows.length < 2) return { ticks: [0, 100], lo: 0, hi: 100 };
    const vals = rows.flatMap((r) => [r.asset, r.inflation]);
    const t = niceTicks(Math.min(0, ...vals), Math.max(...vals));
    return { ticks: t, lo: t[0], hi: t[t.length - 1] };
  }, [rows]);

  const x = (i: number) => pad.l + (i / (rows.length - 1)) * iw;
  const y = (v: number) => pad.t + ih - ((v - lo) / (hi - lo)) * ih;
  const line = (key: 'asset' | 'inflation') => rows.map((r, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(r[key]).toFixed(1)}`).join('');
  const years = rows.map((r, i) => ({ r, i })).filter(({ r }) => r.period.startsWith('01-'));
  const h = hover != null ? rows[hover] : null;

  function onMove(e: React.PointerEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const rel = (e.clientX - rect.left - pad.l) / iw;
    setHover(Math.min(rows.length - 1, Math.max(0, Math.round(rel * (rows.length - 1)))));
  }

  const last = rows[rows.length - 1];

  if (!ready) {
    return <div ref={ref} className="skeleton-shimmer w-full rounded-lg" style={{ height }} aria-hidden="true" />;
  }

  return (
    <figure className="relative m-0">
      <figcaption className="sr-only">{label}</figcaption>
      <div ref={ref} className="relative w-full" style={{ height }}>
        {width > 0 && (
          <svg width={width} height={height} className="block touch-pan-y" onPointerMove={onMove} onPointerLeave={() => setHover(null)} aria-hidden="true">
            {ticks.map((t) => (
              <g key={t}>
                <line
                  x1={pad.l}
                  x2={width - pad.r}
                  y1={y(t)}
                  y2={y(t)}
                  stroke={t === 0 ? 'var(--color-border-strong)' : 'var(--color-border)'}
                  strokeDasharray={t === 0 ? undefined : '2 4'}
                />
                <text x={pad.l - 8} y={y(t)} dy="0.32em" textAnchor="end" className="num fill-muted-foreground text-[10px]">
                  {pctTr(t, { digits: 0 })}
                </text>
              </g>
            ))}
            {years.map(({ r, i }) => (
              <text key={r.period} x={x(i)} y={height - 6} textAnchor="middle" className="num fill-muted-foreground text-[10px]">
                {r.period.slice(3)}
              </text>
            ))}
            <path d={line('inflation')} fill="none" stroke="var(--color-down)" strokeWidth="1.8" strokeDasharray="5 4" strokeLinejoin="round" />
            <path d={line('asset')} fill="none" stroke="var(--color-primary)" strokeWidth="2.2" strokeLinejoin="round" />
            {/* Son noktalar */}
            <circle cx={x(rows.length - 1)} cy={y(last.inflation)} r="3.5" fill="var(--color-down)" />
            <circle cx={x(rows.length - 1)} cy={y(last.asset)} r="3.5" fill="var(--color-primary)" />
            {h && hover != null && (
              <g>
                <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={pad.t + ih} stroke="var(--color-border-strong)" />
                <circle cx={x(hover)} cy={y(h.inflation)} r="4" fill="var(--color-down)" stroke="var(--color-card)" strokeWidth="2" />
                <circle cx={x(hover)} cy={y(h.asset)} r="4" fill="var(--color-primary)" stroke="var(--color-card)" strokeWidth="2" />
              </g>
            )}
          </svg>
        )}
        {h && hover != null && (
          <div
            className={cn(
              'pointer-events-none absolute top-0 z-10 min-w-40 rounded-lg border border-border bg-elevated px-3 py-2 text-[11px] shadow-xl',
              x(hover) > width * 0.6 ? '-translate-x-[calc(100%+10px)]' : 'translate-x-[10px]',
            )}
            style={{ left: x(hover) }}
          >
            <p className="mb-1 font-medium text-foreground">
              {MONTHS_TR[Number(h.period.slice(0, 2)) - 1]} {h.period.slice(3)}
            </p>
            <p className="flex justify-between gap-4 text-muted-foreground">
              {assetLabel} <span className="num text-primary">{pct(h.asset)}</span>
            </p>
            <p className="flex justify-between gap-4 text-muted-foreground">
              Enflasyon <span className="num text-down">{pct(h.inflation)}</span>
            </p>
            <p className="mt-1 flex justify-between gap-4 border-t border-border pt-1 text-muted-foreground">
              Reel <span className="num text-foreground">{pct(((1 + h.asset / 100) / (1 + h.inflation / 100) - 1) * 100)}</span>
            </p>
          </div>
        )}
      </div>
    </figure>
  );
}
