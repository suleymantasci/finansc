'use client';

import { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMarketStore } from '@/stores/market.store';
import { PriceChange } from '@/components/shared/PriceChange';
import { MarketStatus } from '@/components/shared/MarketStatus';
import { DataDisclaimer } from '@/components/shared/DataDisclaimer';
import { SearchBar } from '@/components/shared/SearchBar';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { AdBanner } from '@/components/ads/AdBanner';
import { SkeletonTable } from '@/components/ui/Skeleton';
import { formatDecimal, formatInteger, formatTL } from '@/lib/formatters';
import { cn } from '@/lib/utils';

type MainTab = 'hisseler' | 'endeksler';
type SortTab = 'yukselenler' | 'dusenler' | 'hacim';
type IndexFilter = 'tumu' | 'BIST30' | 'BIST50' | 'BIST100';
type SortDir = 'asc' | 'desc';

interface SortState {
  key: string;
  dir: SortDir;
}

const DEFAULT_SORT: SortState = { key: 'symbol', dir: 'asc' };

const SORT_TAB_MAP: Record<SortTab, SortState> = {
  yukselenler: { key: 'changePercent', dir: 'desc' },
  dusenler: { key: 'changePercent', dir: 'asc' },
  hacim: { key: 'volume', dir: 'desc' },
};

export function BorsaClient() {
  const { indices, stocks, indicesLoading, stocksLoading, flashMap, borsaStreamStatus: status } = useMarketStore();
  const router = useRouter();
  const searchParams = useSearchParams();

  const mainTab = (searchParams.get('tab') as MainTab) || 'hisseler';
  const [sortTab, setSortTab] = useState<SortTab | null>(null);
  const [indexFilter, setIndexFilter] = useState<IndexFilter>('tumu');
  const [search, setSearch] = useState('');
  const [columnSort, setColumnSort] = useState<SortState>(DEFAULT_SORT);
  const [indexColumnSort, setIndexColumnSort] = useState<SortState>({ key: 'symbol', dir: 'asc' });

  const setMainTab = useCallback((tab: MainTab) => {
    const params = new URLSearchParams(searchParams.toString());
    if (tab === 'hisseler') {
      params.delete('tab');
    } else {
      params.set('tab', tab);
    }
    router.replace(`/borsa${params.size ? `?${params}` : ''}`, { scroll: false });
  }, [router, searchParams]);

  const mainTabs: { key: MainTab; label: string }[] = [
    { key: 'hisseler', label: 'Hisseler' },
    { key: 'endeksler', label: 'Endeksler' },
  ];

  const indexFilters: { key: IndexFilter; label: string }[] = [
    { key: 'tumu', label: 'Tümü' },
    { key: 'BIST30', label: 'BIST 30' },
    { key: 'BIST50', label: 'BIST 50' },
    { key: 'BIST100', label: 'BIST 100' },
  ];

  const sortTabs: { key: SortTab; label: string }[] = [
    { key: 'yukselenler', label: 'En Çok Yükselen' },
    { key: 'dusenler', label: 'En Çok Düşen' },
    { key: 'hacim', label: 'En Çok İşlem Gören' },
  ];

  // Effective sort: sortTab overrides column sort
  const effectiveSort = useMemo<SortState>(() => {
    if (sortTab) return SORT_TAB_MAP[sortTab];
    return columnSort;
  }, [sortTab, columnSort]);

  const handleSortTab = (tab: SortTab) => {
    if (sortTab === tab) {
      setSortTab(null);
      setColumnSort(DEFAULT_SORT);
    } else {
      setSortTab(tab);
    }
  };

  const handleColumnSort = (key: string) => {
    setSortTab(null);
    setColumnSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { key, dir: 'asc' },
    );
  };

  const handleIndexColumnSort = (key: string) => {
    setIndexColumnSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { key, dir: 'asc' },
    );
  };

  const SortIcon = ({ active, dir }: { active: boolean; dir?: SortDir }) => {
    if (!active) return <ArrowUpDown className="ml-1 inline h-3 w-3 opacity-30" />;
    if (dir === 'asc') return <ArrowUp className="ml-1 inline h-3 w-3 text-primary" />;
    return <ArrowDown className="ml-1 inline h-3 w-3 text-primary" />;
  };

  const sortItems = <T extends Record<string, unknown>>(items: T[], sort: SortState): T[] => {
    return [...items].sort((a, b) => {
      const aVal = a[sort.key];
      const bVal = b[sort.key];
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        const cmp = aVal.localeCompare(bVal, 'tr');
        return sort.dir === 'asc' ? cmp : -cmp;
      }
      const cmp = ((aVal as number) ?? 0) - ((bVal as number) ?? 0);
      return sort.dir === 'asc' ? cmp : -cmp;
    });
  };

  const filteredStocks = useMemo(() => {
    let result = [...stocks];

    if (indexFilter !== 'tumu') {
      result = result.filter((s) => s.indices?.includes(indexFilter));
    }

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) => s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q),
      );
    }

    return sortItems(result, effectiveSort);
  }, [stocks, indexFilter, search, effectiveSort]);

  const sortedIndices = useMemo(
    () => sortItems([...indices], indexColumnSort),
    [indices, indexColumnSort],
  );

  const stockColumns = [
    { key: 'symbol', label: 'Sembol', align: 'left' as const },
    { key: 'lastPrice', label: 'Son', align: 'right' as const },
    { key: 'buyPrice', label: 'Alış', align: 'right' as const },
    { key: 'sellPrice', label: 'Satış', align: 'right' as const },
    { key: 'low', label: 'En Düşük', align: 'right' as const },
    { key: 'high', label: 'En Yüksek', align: 'right' as const },
    { key: 'changePercent', label: 'Değişim', align: 'right' as const },
    { key: 'volume', label: 'Hacim (Lot)', align: 'right' as const },
    { key: 'turnover', label: 'Hacim (TL)', align: 'right' as const },
    { key: 'time', label: 'Son İşlem', align: 'right' as const },
  ];

  const indexColumns = [
    { key: 'symbol', label: 'Endeks', align: 'left' as const },
    { key: 'value', label: 'Değer', align: 'right' as const },
    { key: 'changePercent', label: 'Değişim', align: 'right' as const },
    { key: 'low', label: 'En Düşük', align: 'right' as const },
    { key: 'high', label: 'En Yüksek', align: 'right' as const },
    { key: 'time', label: 'Saat', align: 'right' as const },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8 pb-20 md:pb-8">
      <div className="mb-6 flex items-center justify-end">
        <MarketStatus status={status} />
      </div>

      <DataDisclaimer variant="borsa" />

      <AdBanner page="borsa" position="top" />

      {/* Main Tabs — underline style */}
      <div className="border-b border-border mb-6">
        <nav className="flex gap-8">
          {mainTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setMainTab(tab.key)}
              className={cn(
                'pb-3 text-sm font-semibold transition-colors border-b-2 -mb-px',
                mainTab === tab.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {mainTab === 'hisseler' ? (
        <>
          {/* Filters row — index filters left, sort tabs right */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div className="flex flex-wrap items-center gap-2">
              {indexFilters.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setIndexFilter(f.key)}
                  className={cn(
                    'rounded-full px-4 py-1.5 text-xs font-medium transition-colors border',
                    indexFilter === f.key
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-muted text-muted-foreground hover:bg-surface-hover',
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {sortTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => handleSortTab(tab.key)}
                  className={cn(
                    'rounded-full px-4 py-1.5 text-xs font-medium transition-colors border',
                    sortTab === tab.key
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-muted text-muted-foreground hover:bg-surface-hover',
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <SearchBar
            placeholder="Hisse ara... (THYAO, ASELS)"
            value={search}
            onChange={setSearch}
            className="mb-4 max-w-md"
          />

          {stocksLoading ? (
            <SkeletonTable rows={15} cols={10} />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted">
                    {stockColumns.map((col) => (
                      <th
                        key={col.key}
                        onClick={() => handleColumnSort(col.key)}
                        className={cn(
                          'px-2 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors whitespace-nowrap',
                          col.align === 'right' ? 'text-right' : 'text-left',
                        )}
                      >
                        {col.label}
                        <SortIcon active={effectiveSort.key === col.key} dir={effectiveSort.dir} />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredStocks.length === 0 ? (
                    <tr>
                      <td colSpan={stockColumns.length} className="px-2 py-8 text-center text-muted-foreground">
                        Veri bulunamadı
                      </td>
                    </tr>
                  ) : (
                    filteredStocks.map((s) => (
                      <tr
                        key={s.symbol}
                        className={cn(
                          'border-b border-border last:border-0 transition-colors hover:bg-surface-hover',
                          flashMap[s.symbol] === 'up' && 'flash-up',
                          flashMap[s.symbol] === 'down' && 'flash-down',
                        )}
                      >
                        <td className="px-2 py-3 font-medium whitespace-nowrap">
                          <Link
                            href={`/borsa/hisseler/${s.symbol}`}
                            className="text-primary hover:underline"
                          >
                            {s.symbol}
                          </Link>
                        </td>
                        <td className="px-2 py-3 text-right num whitespace-nowrap">{formatDecimal(s.lastPrice)}</td>
                        <td className="px-2 py-3 text-right num whitespace-nowrap">{formatDecimal(s.buyPrice)}</td>
                        <td className="px-2 py-3 text-right num whitespace-nowrap">{formatDecimal(s.sellPrice)}</td>
                        <td className="px-2 py-3 text-right num text-muted-foreground whitespace-nowrap">{formatDecimal(s.low)}</td>
                        <td className="px-2 py-3 text-right num text-muted-foreground whitespace-nowrap">{formatDecimal(s.high)}</td>
                        <td className="px-2 py-3 text-right"><PriceChange value={s.changePercent} size="sm" /></td>
                        <td className="px-2 py-3 text-right num text-muted-foreground whitespace-nowrap">{formatInteger(s.volume)}</td>
                        <td className="px-2 py-3 text-right num text-muted-foreground whitespace-nowrap">{formatTL(s.turnover)}</td>
                        <td className="px-2 py-3 text-right text-xs text-muted-foreground whitespace-nowrap">{s.time ?? '—'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : (
        /* Endeksler Tab */
        indicesLoading ? (
          <SkeletonTable rows={8} cols={6} />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted">
                  {indexColumns.map((col) => (
                    <th
                      key={col.key}
                      onClick={() => handleIndexColumnSort(col.key)}
                      className={cn(
                        'px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors whitespace-nowrap',
                        col.align === 'right' ? 'text-right' : 'text-left',
                      )}
                    >
                      {col.label}
                      <SortIcon active={indexColumnSort.key === col.key} dir={indexColumnSort.dir} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedIndices.length === 0 ? (
                  <tr>
                    <td colSpan={indexColumns.length} className="px-4 py-8 text-center text-muted-foreground">
                      Veri bulunamadı
                    </td>
                  </tr>
                ) : (
                  sortedIndices.map((idx) => (
                    <tr
                      key={idx.symbol}
                      className={cn(
                        'border-b border-border last:border-0 transition-colors hover:bg-surface-hover',
                        flashMap[idx.symbol] === 'up' && 'flash-up',
                        flashMap[idx.symbol] === 'down' && 'flash-down',
                      )}
                    >
                      <td className="px-4 py-3 font-medium">
                        <Link
                          href={`/borsa/endeksler/${idx.symbol}`}
                          className="text-primary hover:underline"
                        >
                          {idx.symbol}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-right num">{formatDecimal(idx.value)}</td>
                      <td className="px-4 py-3 text-right"><PriceChange value={idx.changePercent} size="sm" /></td>
                      <td className="px-4 py-3 text-right num text-muted-foreground">{formatDecimal(idx.low)}</td>
                      <td className="px-4 py-3 text-right num text-muted-foreground">{formatDecimal(idx.high)}</td>
                      <td className="px-4 py-3 text-right text-xs text-muted-foreground">{idx.time}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )
      )}

      <AdBanner page="borsa" position="bottom" slotIndex={2} />
    </div>
  );
}
