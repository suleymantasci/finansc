'use client';

import { useId, useMemo, useRef, useState } from 'react';
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

// ── İki serili çizgi grafik (aynı ölçek, % değerler) ──────────────

export function DualLineChart({
  labels,
  a,
  b,
  colorA = 'var(--color-primary)',
  colorB = 'var(--color-up)',
  height = 150,
  label,
}: {
  labels: string[];
  a: number[];
  b: number[];
  colorA?: string;
  colorB?: string;
  height?: number;
  label: string;
}) {
  const dom = useMemo(() => {
    const [min, max] = extent([...a, ...b, 0], 0.1);
    return [min, max] as [number, number];
  }, [a, b]);
  const ticks = useMemo(() => {
    const [min, max] = dom;
    return [0.1, 0.5, 0.9].map((r) => ({ r, v: max - (max - min) * r }));
  }, [dom]);

  if (a.length < 2 || b.length < 2) {
    return <div className="skeleton-shimmer rounded-lg" style={{ height }} aria-hidden="true" />;
  }
  const zeroY = height - ((0 - dom[0]) / (dom[1] - dom[0])) * height;
  // Sadece ocak aylarını etiketle — kısmi ilk yıl etiketi çakışmasın
  const years = labels.map((l, i) => ({ l, i })).filter((x) => x.l.startsWith('01-'));

  return (
    <figure className="relative m-0">
      <figcaption className="sr-only">{label}</figcaption>
      <div className="relative pl-9" style={{ height }}>
        <div className="pointer-events-none absolute inset-y-0 left-0 w-9" aria-hidden="true">
          {ticks.map((t) => (
            <span key={t.r} className="num absolute left-0 -translate-y-1/2 text-[10px] text-muted-foreground" style={{ top: `${t.r * 100}%` }}>
              %{Math.round(t.v)}
            </span>
          ))}
        </div>
        <svg viewBox={`0 0 ${W} ${height}`} preserveAspectRatio="none" className="block h-full w-full overflow-visible" aria-hidden="true">
          {ticks.map((t) => (
            <line key={t.r} x1="0" x2={W} y1={t.r * height} y2={t.r * height} stroke="var(--color-border)" strokeDasharray="2 4" vectorEffect="non-scaling-stroke" />
          ))}
          {dom[0] < 0 && (
            <line x1="0" x2={W} y1={zeroY} y2={zeroY} stroke="var(--color-border-strong)" vectorEffect="non-scaling-stroke" />
          )}
          <path d={pathFor(a, height, dom)} fill="none" stroke={colorA} strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
          <path d={pathFor(b, height, dom)} fill="none" stroke={colorB} strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
        </svg>
      </div>
      <div className="relative mt-1.5 h-4 pl-9" aria-hidden="true">
        {years.map(({ l, i }) => (
          <span
            key={l}
            className="num absolute -translate-x-1/2 text-[10px] text-muted-foreground"
            style={{ left: `calc(2.25rem + (100% - 2.25rem) * ${i / (labels.length - 1)})` }}
          >
            {l.slice(-4)}
          </span>
        ))}
      </div>
    </figure>
  );
}
