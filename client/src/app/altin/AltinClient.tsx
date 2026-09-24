'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMarketStore } from '@/stores/market.store';
import type { GoldStreamData } from '@/stores/market.store';
import { useSSE } from '@/hooks/useSSE';
import { PriceChange } from '@/components/shared/PriceChange';
import { SearchBar } from '@/components/shared/SearchBar';
import { AdBanner } from '@/components/ads/AdBanner';
import { SkeletonTable } from '@/components/ui/Skeleton';
import { formatTL, formatUSD, formatDate, pctTr } from '@/lib/formatters';
import { GOLD_SOURCES } from '@/lib/constants';
import { goldTypeToSlug } from '@/lib/seo-data/gold';
import { cn } from '@/lib/utils';

export function AltinClient() {
  const { goldPrices, flashMap, updateFromGoldStream } = useMarketStore();
  const router = useRouter();
  const searchParams = useSearchParams();

  const activeSource = searchParams.get('kaynak') || 'harem';
  const [search, setSearch] = useState('');

  const setActiveSource = useCallback((source: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (source === 'harem') {
      params.delete('kaynak');
    } else {
      params.set('kaynak', source);
    }
    router.replace(`/altin${params.size ? `?${params}` : ''}`, { scroll: false });
  }, [router, searchParams]);

  // Connect to SSE stream for the selected source — reconnects automatically when source changes
  const handleGoldSSE = useCallback(
    (data: unknown) => {
      const d = data as GoldStreamData;
      if (d.type === 'prices') updateFromGoldStream(d);
    },
    [updateFromGoldStream],
  );

  // Harem global birleşik akışta zaten var; diğer kaynaklar için ayrı akış
  const { status: sourceStatus } = useSSE({
    url: `/api/market/gold/stream/${activeSource}`,
    onMessage: handleGoldSSE,
    enabled: activeSource !== 'harem',
  });

  const filtered = goldPrices
    .filter((g) => g.source === activeSource)
    .filter((g) => !search || g.goldType.toLowerCase().includes(search.toLowerCase()));

  const isLoading = filtered.length === 0 && (activeSource === 'harem' ? goldPrices.length === 0 : sourceStatus === 'connecting');

  const isOns = (goldType: string) => goldType.toLowerCase().includes('ons');
  const money = (g: { goldType: string }, v: number) => (isOns(g.goldType) ? formatUSD(v) : formatTL(v));
  const featured = ['Gram Altın', 'Çeyrek Altın', 'Ons Altın', 'Gram Gümüş']
    .map((t) => goldPrices.find((g) => g.source === activeSource && g.goldType === t) ?? goldPrices.find((g) => g.goldType === t))
    .filter((g): g is NonNullable<typeof g> => !!g);

  return (
    <div className="mx-auto max-w-[1440px] px-4 pb-24 lg:px-8 md:pb-12">
      {/* Bir bakışta */}
      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {featured.map((g) => {
          const slug = goldTypeToSlug(g.goldType);
          return (
            <Link key={g.goldType} href={slug ? `/altin/${slug}` : '/altin'} className="atlas-card atlas-card-link group p-4 sm:p-5">
              <p className="text-[13px] text-muted-foreground group-hover:text-foreground">{g.goldType}</p>
              <p className="num mt-2 text-xl font-medium text-foreground sm:text-2xl">{money(g, g.sellPrice)}</p>
              <PriceChange value={g.changePercent} size="sm" className="mt-1" />
            </Link>
          );
        })}
      </div>

      <AdBanner page="altin" position="top" />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div role="group" aria-label="Fiyat kaynağı" className="scroll-strip -mx-4 flex gap-1 px-4 sm:mx-0 sm:px-0">
          {GOLD_SOURCES.map((src) => (
            <button
              key={src.key}
              type="button"
              aria-pressed={activeSource === src.key}
              onClick={() => setActiveSource(src.key)}
              className={cn(
                'h-9 shrink-0 rounded-full px-4 text-[13px] transition-colors',
                activeSource === src.key ? 'bg-primary text-primary-foreground' : 'border border-border text-muted-foreground hover:text-foreground',
              )}
            >
              {src.label}
            </button>
          ))}
        </div>
        <SearchBar placeholder="Altın türü ara (gram, çeyrek, bilezik)…" value={search} onChange={setSearch} className="w-full sm:max-w-xs" />
      </div>

      {isLoading ? (
        <SkeletonTable rows={8} cols={5} />
      ) : (
        <div className="atlas-card overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <caption className="sr-only">{GOLD_SOURCES.find((x) => x.key === activeSource)?.label} altın fiyatları</caption>
            <thead>
              <tr className="border-b border-border text-left text-[12px] text-muted-foreground">
                <th scope="col" className="px-5 py-3 font-normal">Altın türü</th>
                <th scope="col" className="px-3 py-3 text-right font-normal">Alış</th>
                <th scope="col" className="px-3 py-3 text-right font-normal">Satış</th>
                <th scope="col" className="px-3 py-3 text-right font-normal" title="Satış ile alış arasındaki fark, alışa oranla">Makas</th>
                <th scope="col" className="px-3 py-3 text-right font-normal">Değişim</th>
                <th scope="col" className="px-5 py-3 text-right font-normal">Saat</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-muted-foreground">
                    {search ? `“${search}” ile eşleşen altın türü yok.` : 'Bu kaynak için şu anda veri yok. Başka bir kaynak seçin.'}
                  </td>
                </tr>
              ) : (
                filtered.map((gold) => {
                  const slug = goldTypeToSlug(gold.goldType);
                  const spread = gold.buyPrice > 0 ? ((gold.sellPrice - gold.buyPrice) / gold.buyPrice) * 100 : null;
                  return (
                    <tr
                      key={`${gold.source}-${gold.goldType}`}
                      className={cn(
                        'border-b border-border/60 last:border-0 transition-colors hover:bg-surface-hover',
                        flashMap[`${gold.source}-${gold.goldType}`] === 'up' && 'flash-up',
                        flashMap[`${gold.source}-${gold.goldType}`] === 'down' && 'flash-down',
                      )}
                    >
                      <th scope="row" className="px-5 py-3 text-left font-normal">
                        {slug ? (
                          <Link href={`/altin/${slug}`} className="font-medium text-foreground hover:text-primary">
                            {gold.goldType}
                          </Link>
                        ) : (
                          <span className="text-foreground">{gold.goldType}</span>
                        )}
                      </th>
                      <td className="num px-3 py-3 text-right text-foreground/85">{money(gold, gold.buyPrice)}</td>
                      <td className="num px-3 py-3 text-right text-foreground">{money(gold, gold.sellPrice)}</td>
                      <td className="num px-3 py-3 text-right text-muted-foreground">{spread == null ? '—' : pctTr(spread)}</td>
                      <td className="px-3 py-3 text-right">
                        <PriceChange value={gold.changePercent} size="sm" showIcon={false} />
                      </td>
                      <td className="num px-5 py-3 text-right text-[12px] text-muted-foreground">{formatDate(gold.timestamp)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      <AdBanner page="altin" position="bottom" slotIndex={2} />
    </div>
  );
}
