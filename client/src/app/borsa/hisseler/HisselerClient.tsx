'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useMarketStore } from '@/stores/market.store';
import { SectionIntro } from '@/components/shared/SectionIntro';
import { MarketStatus } from '@/components/shared/MarketStatus';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { PriceChange } from '@/components/shared/PriceChange';
import { AdBanner } from '@/components/ads/AdBanner';
import { SkeletonTable } from '@/components/ui/Skeleton';
import { formatDecimal, formatInteger, formatTL } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import type { Stock } from '@/types';

type IndexFilter = 'tumu' | 'BIST30' | 'BIST50' | 'BIST100';

const columns: Column<Stock>[] = [
  {
    key: 'symbol',
    header: 'Sembol',
    sortable: true,
    sortValue: (s) => s.symbol,
    render: (s) => (
      <Link
        href={`/borsa/hisseler/${s.symbol}`}
        className="font-medium text-primary hover:underline"
      >
        {s.symbol}
      </Link>
    ),
  },
  {
    key: 'buyPrice',
    header: 'Alış',
    sortable: true,
    sortValue: (s) => s.buyPrice,
    className: 'text-right font-mono tabular-nums',
    headerClassName: 'text-right',
    render: (s) => formatDecimal(s.buyPrice),
  },
  {
    key: 'sellPrice',
    header: 'Satış',
    sortable: true,
    sortValue: (s) => s.sellPrice,
    className: 'text-right font-mono tabular-nums hidden sm:table-cell',
    headerClassName: 'text-right hidden sm:table-cell',
    render: (s) => formatDecimal(s.sellPrice),
  },
  {
    key: 'low',
    header: 'En Düşük',
    sortable: true,
    sortValue: (s) => s.low,
    className: 'text-right font-mono tabular-nums text-muted-foreground hidden lg:table-cell',
    headerClassName: 'text-right hidden lg:table-cell',
    render: (s) => formatDecimal(s.low),
  },
  {
    key: 'high',
    header: 'En Yüksek',
    sortable: true,
    sortValue: (s) => s.high,
    className: 'text-right font-mono tabular-nums text-muted-foreground hidden lg:table-cell',
    headerClassName: 'text-right hidden lg:table-cell',
    render: (s) => formatDecimal(s.high),
  },
  {
    key: 'change',
    header: 'Değişim',
    sortable: true,
    sortValue: (s) => s.changePercent,
    className: 'text-right',
    headerClassName: 'text-right',
    render: (s) => <PriceChange value={s.changePercent} size="sm" />,
  },
  {
    key: 'volume',
    header: 'Hacim (Lot)',
    sortable: true,
    sortValue: (s) => s.volume,
    className: 'text-right font-mono tabular-nums text-muted-foreground hidden md:table-cell',
    headerClassName: 'text-right hidden md:table-cell',
    render: (s) => formatInteger(s.volume),
  },
  {
    key: 'turnover',
    header: 'Hacim (TL)',
    sortable: true,
    sortValue: (s) => s.turnover,
    className: 'text-right font-mono tabular-nums text-muted-foreground hidden lg:table-cell',
    headerClassName: 'text-right hidden lg:table-cell',
    render: (s) => formatTL(s.turnover),
  },
];

const indexFilters: { key: IndexFilter; label: string }[] = [
  { key: 'tumu', label: 'Tümü' },
  { key: 'BIST30', label: 'BIST 30' },
  { key: 'BIST50', label: 'BIST 50' },
  { key: 'BIST100', label: 'BIST 100' },
];

export function HisselerClient() {
  const { stocks, stocksLoading, flashMap, borsaStreamStatus: status } = useMarketStore();
  const [indexFilter, setIndexFilter] = useState<IndexFilter>('tumu');

  const filteredStocks = useMemo(() => {
    if (indexFilter === 'tumu') return stocks;
    return stocks.filter((s) => s.indices?.includes(indexFilter));
  }, [stocks, indexFilter]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8 pb-20 md:pb-8">
      <div className="flex items-start justify-between gap-4">
        <SectionIntro
          title="Hisse Senetleri"
          description="Tüm BIST hisselerini anlık takip edin"
        />
        <MarketStatus status={status} />
      </div>

      <AdBanner page="borsa-hisseler" position="top" />

      {/* Endeks Filtresi */}
      <div className="mb-4 flex flex-wrap gap-2">
        {indexFilters.map((f) => (
          <button
            key={f.key}
            onClick={() => setIndexFilter(f.key)}
            className={cn(
              'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors border',
              indexFilter === f.key
                ? 'border-primary/30 bg-primary/10 text-primary'
                : 'border-transparent bg-muted text-muted-foreground hover:bg-surface-hover',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {stocksLoading ? (
        <SkeletonTable rows={15} cols={8} />
      ) : (
        <DataTable
          data={filteredStocks}
          columns={columns}
          keyExtractor={(s) => s.symbol}
          searchable
          searchPlaceholder="Hisse ara... (THYAO, ASELS)"
          searchFilter={(s, q) =>
            s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
          }
          rowClassName={(s) =>
            cn(
              flashMap[s.symbol] === 'up' && 'flash-up',
              flashMap[s.symbol] === 'down' && 'flash-down',
            )
          }
          stickyHeader
        />
      )}

      <AdBanner page="borsa-hisseler" position="bottom" slotIndex={2} />
    </div>
  );
}
