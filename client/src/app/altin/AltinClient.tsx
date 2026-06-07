'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMarketStore } from '@/stores/market.store';
import type { GoldStreamData } from '@/stores/market.store';
import { useSSE } from '@/hooks/useSSE';
import { PriceChange } from '@/components/shared/PriceChange';
import { MarketStatus } from '@/components/shared/MarketStatus';
import { SearchBar } from '@/components/shared/SearchBar';
import { AdBanner } from '@/components/ads/AdBanner';
import { SkeletonTable } from '@/components/ui/Skeleton';
import { formatTL, formatUSD, formatDate } from '@/lib/formatters';
import { GOLD_SOURCES } from '@/lib/constants';
import { goldTypeToSlug } from '@/lib/seo-data/gold';
import { cn } from '@/lib/utils';

export function AltinClient() {
  const { goldPrices, goldStreamStatus, flashMap, updateFromGoldStream } = useMarketStore();
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

  const { status: sourceStatus } = useSSE({
    url: `/api/market/gold/stream/${activeSource}`,
    onMessage: handleGoldSSE,
  });

  const filtered = goldPrices
    .filter((g) => g.source === activeSource)
    .filter((g) => !search || g.goldType.toLowerCase().includes(search.toLowerCase()));

  // Use source-specific SSE status; for harem fallback to global ticker status
  const displayStatus = activeSource === 'harem' ? goldStreamStatus : sourceStatus;
  const isLoading = filtered.length === 0 && sourceStatus === 'connecting';

  const isOns = (goldType: string) => goldType.toLowerCase().includes('ons');

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8 pb-20 md:pb-8">
      <div className="mb-4 flex items-center justify-end">
        <MarketStatus status={displayStatus} />
      </div>

      <AdBanner page="altin" position="top" />

      {/* Source Tabs */}
      <div className="mb-4 flex flex-wrap gap-2">
        {GOLD_SOURCES.map((src) => (
          <button
            key={src.key}
            onClick={() => setActiveSource(src.key)}
            className={cn(
              'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
              activeSource === src.key
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-surface-hover',
            )}
          >
            {src.label}
          </button>
        ))}
      </div>

      <SearchBar
        placeholder="Altın türü ara... (Gram, Çeyrek, Bilezik)"
        value={search}
        onChange={setSearch}
        className="mb-4 max-w-sm"
      />

      {isLoading ? (
        <SkeletonTable rows={8} cols={5} />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Altın Türü</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Alış</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Satış</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Değişim</th>
                <th className="hidden px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:table-cell">Son Güncelleme</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    Bu kaynak için veri bulunamadı
                  </td>
                </tr>
              ) : (
                filtered.map((gold) => (
                  <tr
                    key={`${gold.source}-${gold.goldType}`}
                    className={cn(
                      'border-b border-border last:border-0 transition-colors hover:bg-surface-hover',
                      flashMap[`${gold.source}-${gold.goldType}`] === 'up' && 'flash-up',
                      flashMap[`${gold.source}-${gold.goldType}`] === 'down' && 'flash-down',
                    )}
                  >
                    <td className="px-4 py-3 font-medium">
                      {(() => {
                        const slug = goldTypeToSlug(gold.goldType);
                        if (slug) {
                          return (
                            <Link
                              href={`/altin/${slug}`}
                              className="text-primary hover:underline"
                            >
                              {gold.goldType}
                            </Link>
                          );
                        }
                        return gold.goldType;
                      })()}
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums">
                      {isOns(gold.goldType) ? formatUSD(gold.buyPrice) : formatTL(gold.buyPrice)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums">
                      {isOns(gold.goldType) ? formatUSD(gold.sellPrice) : formatTL(gold.sellPrice)}
                    </td>
                    <td className="px-4 py-3 text-right"><PriceChange value={gold.changePercent} size="sm" /></td>
                    <td className="hidden px-4 py-3 text-right text-xs text-muted-foreground sm:table-cell">
                      {formatDate(gold.timestamp)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <AdBanner page="altin" position="bottom" slotIndex={2} />
    </div>
  );
}
