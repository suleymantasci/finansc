'use client';

import { useEffect, useMemo, useState } from 'react';
import { pctTr } from '@/lib/formatters';
import Link from 'next/link';
import NumberFlow from '@number-flow/react';
import { Calculator, CandlestickChart, Coins, ArrowRight } from 'lucide-react';
import { useMarketStore } from '@/stores/market.store';
import { fetchHistory, instrumentKey, type HistoryPoint, type Interval } from '@/lib/history';
import { pickCurrency, pickGold, pickIndex } from '@/lib/market-pick';
import { AreaChart, CandleChart, Sparkline, type SeriesPoint } from '@/components/charts/MiniCharts';
import { cn } from '@/lib/utils';
import { BORSA_ENABLED } from '@/lib/features';
import { ArrowLink, CardHead, ChangePill, RangeTabs, timeOf } from './parts';

// ── Yardımcılar ────────────────────────────────────────────────────

type RangeId = '1m' | '6m' | '1y' | '5y';
const RANGES: { id: RangeId; label: string; range: string; interval: Interval }[] = [
  { id: '1m', label: '1A', range: '1m', interval: '1d' },
  { id: '6m', label: '6A', range: '6m', interval: '1d' },
  { id: '1y', label: '1Y', range: '1y', interval: '1d' },
  { id: '5y', label: '5Y', range: '5y', interval: '1w' },
];

/** Tek seferlik geçmiş seri; aralık değişince yeniden çeker */
function useSeries(instrument: string, range: string, interval: Interval) {
  const [points, setPoints] = useState<HistoryPoint[]>([]);
  useEffect(() => {
    const ctrl = new AbortController();
    fetchHistory(instrument, { range, interval, signal: ctrl.signal })
      .then((s) => setPoints(s.points ?? []))
      .catch(() => {});
    return () => ctrl.abort();
  }, [instrument, range, interval]);
  return points;
}

/** Serinin son noktasını canlı değerle güncelle — grafik ucu fiyatla aynı olsun */
function withLive(points: HistoryPoint[], live: number | undefined): SeriesPoint[] {
  if (!points.length) return [];
  const out: SeriesPoint[] = points.map((p) => ({ t: p.t, c: p.c, o: p.o, h: p.h, l: p.l }));
  if (live && live > 0) {
    const last = out[out.length - 1];
    out[out.length - 1] = { ...last, c: live, h: Math.max(last.h ?? live, live), l: Math.min(last.l ?? live, live) };
  }
  return out;
}

const fmt2 = { minimumFractionDigits: 2, maximumFractionDigits: 2 } as const;
const fmt4 = { minimumFractionDigits: 4, maximumFractionDigits: 4 } as const;

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] text-muted-foreground">{label}</dt>
      <dd className="num mt-0.5 text-[13px] text-foreground/90">{value}</dd>
    </div>
  );
}

const tr = (v: number | null | undefined, d = 2) =>
  v == null ? '—' : v.toLocaleString('tr-TR', { minimumFractionDigits: d, maximumFractionDigits: d });

// ── Gram Altın ─────────────────────────────────────────────────────

function GoldCard() {
  const goldPrices = useMarketStore((s) => s.goldPrices);
  const gold = pickGold(goldPrices, 'Gram Altın');
  const [range, setRange] = useState<RangeId>('1m');
  const r = RANGES.find((x) => x.id === range)!;
  const raw = useSeries(instrumentKey.gold('serbest-piyasa', 'gram-altin'), r.range, r.interval);
  const series = useMemo(() => withLive(raw, gold?.sellPrice), [raw, gold?.sellPrice]);
  const periodChange = series.length > 1 ? ((series[series.length - 1].c - series[0].c) / series[0].c) * 100 : null;

  return (
    <article className="atlas-card flex flex-col p-5 sm:p-6 lg:row-span-2" aria-labelledby="card-gram">
      <CardHead icon={<Coins className="h-4 w-4" />} title="Gram Altın" href="/altin/gram-altin" meta={timeOf(gold?.timestamp)} />
      <span id="card-gram" className="sr-only">Gram altın fiyatı</span>

      <div className="mt-5 flex flex-wrap items-end gap-x-3 gap-y-2">
        <p className="num text-4xl font-medium tracking-tight text-foreground sm:text-[2.75rem]" aria-live="polite">
          {gold ? <NumberFlow value={gold.sellPrice} locales="tr-TR" format={fmt2} suffix=" ₺" /> : <span className="skeleton-shimmer inline-block h-10 w-48 rounded" />}
        </p>
        <ChangePill value={gold?.changePercent} className="mb-2" />
      </div>
      <dl className="mt-3 flex gap-6">
        <Stat label="Alış" value={tr(gold?.buyPrice)} />
        <Stat label="Satış" value={tr(gold?.sellPrice)} />
        <Stat label={`${r.label} değişim`} value={periodChange == null ? '—' : pctTr(periodChange, { signed: true })} />
      </dl>

      <div className="mt-6 flex-1">
        <AreaChart points={series} height={200} label={`Gram altın ${r.label} fiyat grafiği`} />
      </div>
      <div className="mt-4 flex items-center justify-between">
        <RangeTabs options={RANGES} value={range} onChange={setRange} label="Grafik aralığı" />
        <ArrowLink href="/altin" className="text-[13px]">
          Tüm altınlar
        </ArrowLink>
      </div>
    </article>
  );
}

// ── Döviz (USD, EUR) ───────────────────────────────────────────────

function FxCard({ code, href, symbol, name }: { code: 'USD' | 'EUR'; href: string; symbol: string; name: string }) {
  const list = useMarketStore((s) => s.serbestCurrencies);
  const c = pickCurrency(list, code);
  const raw = useSeries(instrumentKey.fx(code), '1m', '1d');
  const series = useMemo(() => withLive(raw, c?.sellPrice), [raw, c?.sellPrice]);
  const last = raw[raw.length - 1];
  const up = (c?.changePercent ?? 0) >= 0;

  return (
    <article className="atlas-card flex flex-col p-5">
      <CardHead
        icon={<span className="num text-[13px] font-semibold">{symbol}</span>}
        title={`${code}/TRY`}
        href={href}
        meta={timeOf(c?.time ?? c?.timestamp)}
      />
      <span className="sr-only">{name} kuru</span>
      <div className="mt-4 flex items-end justify-between gap-3">
        <p className="num text-[1.75rem] font-medium leading-none tracking-tight text-foreground" aria-live="polite">
          {c ? <NumberFlow value={c.sellPrice} locales="tr-TR" format={fmt4} /> : <span className="skeleton-shimmer inline-block h-7 w-28 rounded" />}
        </p>
        <ChangePill value={c?.changePercent} />
      </div>
      <Sparkline
        values={series.map((p) => p.c)}
        color={up ? 'var(--color-up)' : 'var(--color-down)'}
        height={56}
        className="mt-4"
      />
      <dl className="mt-3 flex gap-5">
        <Stat label="Alış" value={tr(c?.buyPrice, 4)} />
        <Stat label="Gün düşük" value={tr(last?.l, 4)} />
        <Stat label="Gün yüksek" value={tr(last?.h, 4)} />
      </dl>
    </article>
  );
}

// ── BIST 100 ───────────────────────────────────────────────────────

function BistCard() {
  const indices = useMarketStore((s) => s.indices);
  const idx = pickIndex(indices, 'XU100');
  const raw = useSeries(instrumentKey.index('XU100'), '2m', '1d');
  const series = useMemo(() => withLive(raw.slice(-32), idx?.value), [raw, idx?.value]);

  return (
    <article className="atlas-card flex flex-col p-5 sm:p-6 lg:row-span-2">
      <CardHead icon={<CandlestickChart className="h-4 w-4" />} title="BIST 100" href="/borsa/endeksler/XU100" meta={timeOf(idx?.time)} />
      <div className="mt-5 flex flex-wrap items-end gap-x-3 gap-y-2">
        <p className="num text-4xl font-medium tracking-tight text-foreground sm:text-[2.5rem]" aria-live="polite">
          {idx ? <NumberFlow value={idx.value} locales="tr-TR" format={fmt2} /> : <span className="skeleton-shimmer inline-block h-10 w-44 rounded" />}
        </p>
        <ChangePill value={idx?.changePercent} className="mb-2" />
      </div>
      <dl className="mt-3 flex gap-6">
        <Stat label="Gün düşük" value={tr(idx?.low)} />
        <Stat label="Gün yüksek" value={tr(idx?.high)} />
      </dl>
      <div className="mt-6 flex-1">
        <CandleChart points={series} height={220} label="BIST 100 son iki ay günlük mum grafiği" />
      </div>
      <p className="mt-4 text-[11px] text-muted-foreground">Günlük mumlar · BIST verileri 15 dk gecikmeli</p>
    </article>
  );
}

// ── Kredi hesaplayıcı ──────────────────────────────────────────────

const BSMV = 0.15;
const KKDF = 0.15;

function Slider({
  id,
  label,
  value,
  min,
  max,
  step,
  onChange,
  display,
}: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  display: string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <label htmlFor={id} className="text-[12px] text-muted-foreground">
          {label}
        </label>
        <span className="num text-[13px] text-foreground">{display}</span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-valuetext={display}
        className="atlas-range mt-2 w-full"
        style={{ ['--pct' as string]: `${pct}%` }}
      />
    </div>
  );
}

function LoanCard() {
  const [amount, setAmount] = useState(500_000);
  const [term, setTerm] = useState(24);
  const [rate, setRate] = useState(3.49);

  // Aylık efektif oran: faiz × (1 + BSMV + KKDF) — ihtiyaç kredisi aracıyla aynı yaklaşım
  const r = (rate / 100) * (1 + BSMV + KKDF);
  const pow = Math.pow(1 + r, term);
  const monthly = r === 0 ? amount / term : (amount * r * pow) / (pow - 1);
  const total = monthly * term;

  const detailHref = `/araclar/ihtiyac-kredisi?amount=${amount}&rate=${rate}&term=${term}`;

  return (
    <article className={cn('atlas-card flex flex-col p-5 sm:p-6 lg:row-span-2', !BORSA_ENABLED && 'md:max-lg:col-span-2')}>
      <CardHead icon={<Calculator className="h-4 w-4" />} title="Kredi Hesaplama" href="/araclar/ihtiyac-kredisi" />
      <div className="mt-5 space-y-5">
        <Slider
          id="loan-amount"
          label="Kredi tutarı"
          value={amount}
          min={10_000}
          max={2_000_000}
          step={10_000}
          onChange={setAmount}
          display={`${amount.toLocaleString('tr-TR')} ₺`}
        />
        <Slider id="loan-term" label="Vade" value={term} min={3} max={60} step={1} onChange={setTerm} display={`${term} ay`} />
        <Slider
          id="loan-rate"
          label="Aylık faiz"
          value={rate}
          min={0.5}
          max={6}
          step={0.01}
          onChange={setRate}
          display={`%${rate.toLocaleString('tr-TR', fmt2)}`}
        />
      </div>

      <div className="mt-6 rounded-xl border border-border bg-elevated p-4">
        <p className="text-[12px] text-muted-foreground">Aylık taksit</p>
        <p className="num mt-1 text-[2rem] font-medium leading-none text-foreground" aria-live="polite">
          <NumberFlow value={monthly} locales="tr-TR" format={fmt2} suffix=" ₺" />
        </p>
        <p className="num mt-2 text-[12px] text-muted-foreground">
          Toplam geri ödeme {total.toLocaleString('tr-TR', fmt2)} ₺
        </p>
      </div>
      <Link
        href={detailHref}
        className="group mt-4 flex h-11 items-center justify-center gap-2 rounded-full border border-primary/60 text-sm font-medium text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
      >
        Ödeme planını gör
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
      </Link>
      <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">BSMV %15 ve KKDF %15 dahil, bilgi amaçlıdır.</p>
    </article>
  );
}

// ── Izgara ─────────────────────────────────────────────────────────

export function MarketBento() {
  return (
    <section aria-labelledby="piyasalar-title" className="mx-auto max-w-[1440px] px-4 lg:px-8">
      <h2 id="piyasalar-title" className="sr-only">
        {BORSA_ENABLED
          ? 'Canlı piyasalar: gram altın, dolar, euro, BIST 100 ve kredi hesaplama'
          : 'Canlı piyasalar: gram altın, dolar, euro ve kredi hesaplama'}
      </h2>
      <div
        className={cn(
          'space-y-4 md:grid md:grid-cols-2 md:gap-4 md:space-y-0 lg:grid-rows-[auto_auto]',
          BORSA_ENABLED ? 'lg:grid-cols-[1.25fr_1fr_1.1fr_1fr]' : 'lg:grid-cols-[1.25fr_1fr_1fr]',
        )}
      >
        {/* Mobilde yatay kaydırılan piyasa şeridi; md+ ızgaraya karışır */}
        <div
          className={cn(
            'scroll-strip -mx-4 flex snap-x snap-mandatory gap-3 px-4 pb-1 md:contents',
            '[&_article]:w-[84vw] [&_article]:max-w-[360px] [&_article]:shrink-0 [&_article]:snap-start',
            'md:[&_article]:w-auto md:[&_article]:max-w-none',
          )}
        >
          <GoldCard />
          <div className="contents md:grid md:gap-4 lg:row-span-2">
            <FxCard code="USD" href="/doviz/dolar" symbol="$" name="Amerikan doları" />
            <FxCard code="EUR" href="/doviz/euro" symbol="€" name="Euro" />
          </div>
          {BORSA_ENABLED && <BistCard />}
        </div>
        <LoanCard />
      </div>
    </section>
  );
}
