'use client';

import { useMemo, useState } from 'react';
import { pctTr } from '@/lib/formatters';
import Link from 'next/link';
import { useMarketStore } from '@/stores/market.store';
import { STOCK_META } from '@/lib/seo-data/stocks';
import { RangeBar } from '@/components/charts/MiniCharts';
import type { Stock } from '@/types';
import { cn } from '@/lib/utils';
import { ArrowLink, SectionHead } from './parts';

type Tab = 'gainers' | 'losers' | 'active';
const TABS: { id: Tab; label: string }[] = [
  { id: 'gainers', label: 'Yükselenler' },
  { id: 'losers', label: 'Düşenler' },
  { id: 'active', label: 'En çok işlem' },
];

/** Sığ tahtaları eleyip anlamlı liste vermek için işlem hacmine göre ilk N */
const LIQUID_UNIVERSE = 150;

/** Sembolden deterministik renk tonu — logo yerine monogram */
function hueOf(symbol: string): number {
  let h = 0;
  for (const ch of symbol) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return h;
}

function Monogram({ symbol }: { symbol: string }) {
  const hue = hueOf(symbol);
  return (
    <span
      className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[10px] font-semibold tracking-tight"
      style={{
        background: `color-mix(in oklch, oklch(0.62 0.14 ${hue}) 22%, var(--color-card))`,
        color: `color-mix(in oklch, oklch(0.78 0.14 ${hue}) 80%, var(--color-foreground))`,
      }}
      aria-hidden="true"
    >
      {symbol.slice(0, 2)}
    </span>
  );
}

function fmt(v: number, d = 2) {
  return v.toLocaleString('tr-TR', { minimumFractionDigits: d, maximumFractionDigits: d });
}

function turnoverFmt(v: number) {
  return new Intl.NumberFormat('tr-TR', { notation: 'compact', maximumFractionDigits: 1 }).format(v);
}

function MoversTable({ rows, start, caption, flashMap }: { rows: Stock[]; start: number; caption: string; flashMap: Record<string, 'up' | 'down'> }) {
  return (
    <table className="w-full border-collapse text-sm">
      <caption className="sr-only">{caption}</caption>
      <thead>
        <tr className="border-b border-border text-left text-[11px] text-muted-foreground">
          <th scope="col" className="w-8 py-2.5 font-normal">#</th>
          <th scope="col" className="py-2.5 font-normal">Hisse</th>
          <th scope="col" className="py-2.5 text-right font-normal">Fiyat</th>
          <th scope="col" className="py-2.5 pl-3 text-right font-normal">Değişim</th>
          <th scope="col" className="hidden w-28 py-2.5 pl-6 font-normal sm:table-cell">Gün aralığı</th>
          <th scope="col" className="hidden py-2.5 text-right font-normal xl:table-cell">Hacim</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((s, i) => {
          const ch = s.changePercent ?? 0;
          const name = STOCK_META[s.symbol]?.name ?? (s.name !== s.symbol ? s.name : '');
          return (
            <tr
              key={s.symbol}
              className={cn(
                'group border-b border-border/60 last:border-0 transition-colors hover:bg-surface-hover',
                flashMap[s.symbol] === 'up' && 'flash-up',
                flashMap[s.symbol] === 'down' && 'flash-down',
              )}
            >
              <td className="num py-2.5 text-[12px] text-muted-foreground">{start + i}</td>
              <td className="py-2.5">
                <Link href={`/borsa/hisseler/${s.symbol}`} className="flex items-center gap-3">
                  <Monogram symbol={s.symbol} />
                  <span className="min-w-0">
                    <span className="block font-medium text-foreground group-hover:text-primary">{s.symbol}</span>
                    {name && <span className="block max-w-[16ch] truncate text-[12px] text-muted-foreground">{name}</span>}
                  </span>
                </Link>
              </td>
              <td className="num py-2.5 text-right text-foreground">{fmt(s.lastPrice)} ₺</td>
              <td className={cn('num py-2.5 pl-3 text-right font-medium', ch > 0 && 'text-up', ch < 0 && 'text-down', ch === 0 && 'text-neutral')}>
                {pctTr(ch, { signed: true })}
              </td>
              <td className="hidden py-2.5 pl-6 sm:table-cell">
                <RangeBar low={s.low} high={s.high} value={s.lastPrice} />
              </td>
              <td className="num hidden py-2.5 text-right text-[12px] text-muted-foreground xl:table-cell">{turnoverFmt(s.turnover)} ₺</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export function MoversSection() {
  const { stocks, stocksLoading, flashMap } = useMarketStore();
  const [tab, setTab] = useState<Tab>('gainers');

  const rows = useMemo(() => {
    // Evren: BIST 100 bileşenleri (kaynak veride endeks üyeliği var); yoksa hacme göre ilk N
    const traded = [...stocks].filter((s) => s.lastPrice > 0 && s.turnover > 0);
    const bist100 = traded.filter((s) => s.indices?.includes('BIST100'));
    const liquid = (bist100.length >= 50 ? bist100 : traded).sort((a, b) => b.turnover - a.turnover).slice(0, LIQUID_UNIVERSE);
    if (tab === 'active') return liquid.slice(0, 10);
    const sorted = liquid.sort((a, b) => (b.changePercent ?? 0) - (a.changePercent ?? 0));
    return tab === 'gainers' ? sorted.slice(0, 10) : sorted.slice(-10).reverse();
  }, [stocks, tab]);

  const caption = `${TABS.find((t) => t.id === tab)!.label} — BIST 100 hisseleri`;

  return (
    <section aria-labelledby="movers-title" className="mx-auto max-w-[1440px] px-4 lg:px-8">
      <div className="atlas-card p-5 sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <SectionHead id="movers-title" eyebrow="BIST 100" title="Hareket edenler" />
          <div className="-mt-2 mb-6 flex items-center gap-3 sm:mt-0">
            <div role="tablist" aria-label="Liste türü" className="flex rounded-full border border-border bg-elevated p-1">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={tab === t.id}
                  aria-controls="movers-panel"
                  onClick={() => setTab(t.id)}
                  className={cn(
                    'h-8 rounded-full px-3.5 text-[13px] transition-colors',
                    tab === t.id ? 'bg-card text-foreground shadow-sm ring-1 ring-border' : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <ArrowLink href="/borsa?tab=hisseler" className="hidden md:inline-flex">
              Tüm hisseler
            </ArrowLink>
          </div>
        </div>

        <div id="movers-panel" role="tabpanel" aria-label={caption}>
          {stocksLoading && rows.length === 0 ? (
            <div className="grid gap-x-10 lg:grid-cols-2">
              {Array.from({ length: 2 }).map((_, c) => (
                <div key={c} className="space-y-3 py-2">
                  {Array.from({ length: 5 }).map((__, i) => (
                    <div key={i} className="skeleton-shimmer h-10 rounded-lg" />
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <div className="grid gap-x-10 lg:grid-cols-2">
              <MoversTable rows={rows.slice(0, 5)} start={1} caption={caption} flashMap={flashMap} />
              <MoversTable rows={rows.slice(5, 10)} start={6} caption={`${caption} (6–10)`} flashMap={flashMap} />
            </div>
          )}
        </div>
        <p className="mt-4 text-[11px] text-muted-foreground">BIST verileri 15 dakika gecikmelidir. Yatırım tavsiyesi değildir.</p>
      </div>
    </section>
  );
}
