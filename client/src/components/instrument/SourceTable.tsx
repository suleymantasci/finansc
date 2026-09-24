'use client';

import { useEffect } from 'react';
import { useMarketStore } from '@/stores/market.store';
import { GOLD_BY_SLUG } from '@/lib/instruments/gold';
import { CURRENCY_BY_CODE } from '@/lib/instruments/currencies';
import { sourceLabel } from '@/lib/quote';
import { API_URL } from '@/lib/constants';
import { pctTr } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import type { GoldPrice } from '@/types';

/**
 * Kaynaklara göre fiyatlar. Altında tüm kuyumcu/banka kaynakları, dövizde
 * serbest piyasa + TCMB. "Hangi kaynak ne diyor" sorusuna tek tabloda cevap.
 */

/**
 * Tüm altın kaynakları: 6 ayrı SSE yerine 20 sn'de bir tek REST isteği.
 * Tarayıcılar HTTP/1.1'de aynı sunucuya en fazla 6 bağlantı açar; şeritteki akışlarla
 * birlikte 9+ kalıcı bağlantı sayfa geçişlerini kilitliyordu. Sekme gizliyken durur.
 */
function useAllGoldSources(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    let stop = false;
    const load = async () => {
      if (document.hidden) return;
      try {
        const res = await fetch(`${API_URL}/api/market/gold`);
        if (!res.ok || stop) return;
        const list = (await res.json()) as GoldPrice[];
        const bySource = new Map<string, GoldPrice[]>();
        for (const g of list) bySource.set(g.source, [...(bySource.get(g.source) ?? []), g]);
        for (const [source, prices] of bySource) useMarketStore.getState().updateFromGoldStream({ type: 'prices', source, prices });
      } catch {
        /* bir sonraki turda yeniden denenir */
      }
    };
    load();
    const t = setInterval(load, 20000);
    return () => {
      stop = true;
      clearInterval(t);
    };
  }, [enabled]);
}

const nf = (v: number, d: number) => v.toLocaleString('tr-TR', { minimumFractionDigits: d, maximumFractionDigits: d });

function timeOf(t?: string) {
  if (!t) return '—';
  if (/^\d{1,2}:\d{2}/.test(t)) return t.slice(0, 5);
  const d = new Date(t);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Istanbul' });
}

export function SourceTable({ kind, id }: { kind: 'gold' | 'fx'; id: string }) {
  useAllGoldSources(kind === 'gold');
  const { goldPrices, serbestCurrencies, merkezCurrencies, flashMap } = useMarketStore();

  let rows: { key: string; source: string; variant?: string; buy: number; sell: number; change: number | null; time?: string; flash?: 'up' | 'down' }[] = [];
  let d = 2;
  if (kind === 'gold') {
    const g = GOLD_BY_SLUG[id];
    const names = g ? [g.liveName, ...(g.variants ?? [])] : [];
    rows = goldPrices
      .filter((p) => names.includes(p.goldType))
      .sort((a, b) => (a.goldType === b.goldType ? sourceLabel(a.source).localeCompare(sourceLabel(b.source), 'tr') : names.indexOf(a.goldType) - names.indexOf(b.goldType)))
      .map((p) => ({
        key: `${p.source}-${p.goldType}`,
        source: sourceLabel(p.source),
        variant: p.goldType !== g?.liveName ? p.goldType : undefined,
        buy: p.buyPrice,
        sell: p.sellPrice,
        change: p.changePercent,
        time: p.timestamp,
        flash: flashMap[`${p.source}-${p.goldType}`],
      }));
  } else {
    d = 4;
    const c = CURRENCY_BY_CODE[id];
    if (c) {
      const s = c.serbestName ? serbestCurrencies.find((x) => x.name === c.serbestName) : undefined;
      const m = c.tcmbName ? merkezCurrencies.find((x) => x.name === c.tcmbName) : undefined;
      if (s) rows.push({ key: 's', source: 'Serbest piyasa', buy: s.buyPrice, sell: s.sellPrice, change: s.changePercent, time: s.time });
      if (m) rows.push({ key: 'm', source: 'TCMB (gösterge)', buy: m.buyPrice / c.tcmbUnit, sell: m.sellPrice / c.tcmbUnit, change: m.changePercent, time: m.time });
    }
  }

  return (
    <section aria-labelledby={`src-${id}`} className="atlas-card overflow-hidden">
      <div className="flex items-center justify-between px-5 pt-5 sm:px-6">
        <h2 id={`src-${id}`} className="font-display text-2xl text-foreground">
          Kaynaklara göre fiyat
        </h2>
        <span className="text-[12px] text-muted-foreground">{rows.length} kaynak</span>
      </div>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[480px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-[12px] text-muted-foreground">
              <th scope="col" className="px-5 py-2.5 font-normal sm:px-6">Kaynak</th>
              <th scope="col" className="px-3 py-2.5 text-right font-normal">Alış</th>
              <th scope="col" className="px-3 py-2.5 text-right font-normal">Satış</th>
              <th scope="col" className="px-3 py-2.5 text-right font-normal">Değişim</th>
              <th scope="col" className="px-5 py-2.5 text-right font-normal sm:px-6">Saat</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0
              ? Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="border-b border-border/60">
                    <td colSpan={5} className="px-6 py-3">
                      <div className="skeleton-shimmer h-4 rounded" />
                    </td>
                  </tr>
                ))
              : rows.map((r) => {
                  const ch = r.change ?? 0;
                  return (
                    <tr key={r.key} className={cn('border-b border-border/60 last:border-0', r.flash === 'up' && 'flash-up', r.flash === 'down' && 'flash-down')}>
                      <th scope="row" className="px-5 py-3 text-left font-normal text-foreground sm:px-6">
                        {r.source}
                        {r.variant && <span className="ml-2 text-[11px] text-muted-foreground">{r.variant}</span>}
                      </th>
                      <td className="num px-3 py-3 text-right text-foreground/85">{nf(r.buy, d)}</td>
                      <td className="num px-3 py-3 text-right text-foreground">{nf(r.sell, d)}</td>
                      <td className={cn('num px-3 py-3 text-right', ch > 0 && 'text-up', ch < 0 && 'text-down', ch === 0 && 'text-neutral')}>
                        {pctTr(ch, { signed: true })}
                      </td>
                      <td className="num px-5 py-3 text-right text-[12px] text-muted-foreground sm:px-6">{timeOf(r.time)}</td>
                    </tr>
                  );
                })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
