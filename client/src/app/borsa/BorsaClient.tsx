'use client';

import { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMarketStore } from '@/stores/market.store';
import { PriceChange } from '@/components/shared/PriceChange';
import { DataDisclaimer } from '@/components/shared/DataDisclaimer';
import { SearchBar } from '@/components/shared/SearchBar';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { AdBanner } from '@/components/ads/AdBanner';
import { SkeletonTable } from '@/components/ui/Skeleton';
import { formatDecimal, formatInteger, formatVolume } from '@/lib/formatters';
import { STOCK_META } from '@/lib/seo-data/stocks';
import { INDEX_META } from '@/lib/seo-data/indices';
import { cn } from '@/lib/utils';

type MainTab = 'hisseler' | 'endeksler';
type SortTab = 'yukselenler' | 'dusenler' | 'hacim';
// Endeks üyeliği kaynak veriden gelir (tasci-api: BIST30 / BIST50 / BIST100)
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
  const { indices, stocks, indicesLoading, stocksLoading, flashMap } = useMarketStore();
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
    { key: 'yukselenler', label: 'Yükselenler' },
    { key: 'dusenler', label: 'Düşenler' },
    { key: 'hacim', label: 'En çok işlem' },
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
    { key: 'symbol', label: 'Hisse', align: 'left' as const, cls: '' },
    { key: 'lastPrice', label: 'Son', align: 'right' as const, cls: '' },
    { key: 'changePercent', label: 'Değişim', align: 'right' as const, cls: '' },
    { key: 'low', label: 'Gün düşük', align: 'right' as const, cls: 'hidden md:table-cell' },
    { key: 'high', label: 'Gün yüksek', align: 'right' as const, cls: 'hidden md:table-cell' },
    { key: 'volume', label: 'Hacim (lot)', align: 'right' as const, cls: 'hidden xl:table-cell' },
    { key: 'turnover', label: 'Hacim (₺)', align: 'right' as const, cls: 'hidden sm:table-cell' },
    { key: 'time', label: 'Saat', align: 'right' as const, cls: 'hidden lg:table-cell' },
  ];

  const indexColumns = [
    { key: 'symbol', label: 'Endeks', align: 'left' as const, cls: '' },
    { key: 'value', label: 'Değer', align: 'right' as const, cls: '' },
    { key: 'changePercent', label: 'Değişim', align: 'right' as const, cls: '' },
    { key: 'low', label: 'Gün düşük', align: 'right' as const, cls: 'hidden sm:table-cell' },
    { key: 'high', label: 'Gün yüksek', align: 'right' as const, cls: 'hidden sm:table-cell' },
    { key: 'time', label: 'Saat', align: 'right' as const, cls: 'hidden md:table-cell' },
  ];

  const pill = (active: boolean) =>
    cn(
      'h-9 shrink-0 rounded-full px-4 text-[13px] transition-colors',
      active ? 'bg-primary text-primary-foreground' : 'border border-border text-muted-foreground hover:text-foreground',
    );

  const Th = ({ col, sort, onSort }: { col: { key: string; label: string; align: 'left' | 'right'; cls: string }; sort: SortState; onSort: (k: string) => void }) => (
    <th
      scope="col"
      aria-sort={sort.key === col.key ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}
      className={cn('whitespace-nowrap px-3 py-3 font-normal first:pl-5 last:pr-5', col.align === 'right' ? 'text-right' : 'text-left', col.cls)}
    >
      <button type="button" onClick={() => onSort(col.key)} className="inline-flex items-center hover:text-foreground">
        {col.label}
        <SortIcon active={sort.key === col.key} dir={sort.dir} />
      </button>
    </th>
  );

  return (
    <div className="mx-auto max-w-[1440px] px-4 pb-24 lg:px-8 md:pb-12">
      <AdBanner page="borsa" position="top" />

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <div role="group" aria-label="Liste" className="flex gap-1">
            {mainTabs.map((tab) => (
              <button key={tab.key} type="button" aria-pressed={mainTab === tab.key} onClick={() => setMainTab(tab.key)} className={pill(mainTab === tab.key)}>
                {tab.label}
              </button>
            ))}
          </div>
          {mainTab === 'hisseler' && (
            <div role="group" aria-label="Endeks" className="scroll-strip flex gap-1 border-l border-border pl-2">
              {indexFilters.map((f) => (
                <button key={f.key} type="button" aria-pressed={indexFilter === f.key} onClick={() => setIndexFilter(f.key)} className={pill(indexFilter === f.key)}>
                  {f.label}
                </button>
              ))}
            </div>
          )}
          {mainTab === 'hisseler' && (
            <div role="group" aria-label="Hızlı sıralama" className="scroll-strip flex gap-1 border-l border-border pl-2">
              {sortTabs.map((tab) => (
                <button key={tab.key} type="button" aria-pressed={sortTab === tab.key} onClick={() => handleSortTab(tab.key)} className={pill(sortTab === tab.key)}>
                  {tab.label}
                </button>
              ))}
            </div>
          )}
        </div>
        {mainTab === 'hisseler' && (
          <SearchBar placeholder="Hisse ara (THYAO, ASELS)…" value={search} onChange={setSearch} className="w-full lg:max-w-xs" />
        )}
      </div>

      {mainTab === 'hisseler' ? (
        stocksLoading && stocks.length === 0 ? (
          <SkeletonTable rows={15} cols={8} />
        ) : (
          <>
            <p className="mb-2 text-[12px] text-muted-foreground">{filteredStocks.length} hisse</p>
            <div className="atlas-card overflow-x-auto">
              <table className="w-full text-sm">
                <caption className="sr-only">Borsa İstanbul hisse senetleri</caption>
                <thead>
                  <tr className="border-b border-border text-[12px] text-muted-foreground">
                    {stockColumns.map((col) => (
                      <Th key={col.key} col={col} sort={effectiveSort} onSort={handleColumnSort} />
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredStocks.length === 0 ? (
                    <tr>
                      <td colSpan={stockColumns.length} className="px-5 py-10 text-center text-muted-foreground">
                        {search ? `“${search}” ile eşleşen hisse yok.` : 'Veri bulunamadı.'}
                      </td>
                    </tr>
                  ) : (
                    filteredStocks.map((s) => {
                      const name = STOCK_META[s.symbol]?.name;
                      return (
                        <tr
                          key={s.symbol}
                          className={cn(
                            'border-b border-border/60 last:border-0 transition-colors hover:bg-surface-hover',
                            flashMap[s.symbol] === 'up' && 'flash-up',
                            flashMap[s.symbol] === 'down' && 'flash-down',
                          )}
                        >
                          <th scope="row" className="whitespace-nowrap px-3 py-2.5 pl-5 text-left font-normal">
                            <Link href={`/borsa/hisseler/${s.symbol}`} className="group block">
                              <span className="font-medium text-foreground group-hover:text-primary">{s.symbol}</span>
                              {name && <span className="block max-w-[22ch] truncate text-[12px] text-muted-foreground">{name}</span>}
                            </Link>
                          </th>
                          <td className="num whitespace-nowrap px-3 py-2.5 text-right text-foreground">{formatDecimal(s.lastPrice)}</td>
                          <td className="whitespace-nowrap px-3 py-2.5 text-right">
                            <PriceChange value={s.changePercent} size="sm" showIcon={false} />
                          </td>
                          <td className="num hidden whitespace-nowrap px-3 py-2.5 text-right text-muted-foreground md:table-cell">{formatDecimal(s.low)}</td>
                          <td className="num hidden whitespace-nowrap px-3 py-2.5 text-right text-muted-foreground md:table-cell">{formatDecimal(s.high)}</td>
                          <td className="num hidden whitespace-nowrap px-3 py-2.5 text-right text-muted-foreground xl:table-cell">{formatInteger(s.volume)}</td>
                          <td className="num hidden whitespace-nowrap px-3 py-2.5 text-right text-muted-foreground sm:table-cell">{formatVolume(s.turnover)}</td>
                          <td className="num hidden whitespace-nowrap px-3 py-2.5 pr-5 text-right text-[12px] text-muted-foreground lg:table-cell">{s.time ?? '—'}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </>
        )
      ) : indicesLoading && indices.length === 0 ? (
        <SkeletonTable rows={8} cols={6} />
      ) : (
        <>
          <p className="mb-2 text-[12px] text-muted-foreground">{sortedIndices.length} endeks</p>
          <div className="atlas-card overflow-x-auto">
            <table className="w-full text-sm">
              <caption className="sr-only">Borsa İstanbul endeksleri</caption>
              <thead>
                <tr className="border-b border-border text-[12px] text-muted-foreground">
                  {indexColumns.map((col) => (
                    <Th key={col.key} col={col} sort={indexColumnSort} onSort={handleIndexColumnSort} />
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedIndices.length === 0 ? (
                  <tr>
                    <td colSpan={indexColumns.length} className="px-5 py-10 text-center text-muted-foreground">
                      Veri bulunamadı.
                    </td>
                  </tr>
                ) : (
                  sortedIndices.map((idx) => (
                    <tr
                      key={idx.symbol}
                      className={cn(
                        'border-b border-border/60 last:border-0 transition-colors hover:bg-surface-hover',
                        flashMap[idx.symbol] === 'up' && 'flash-up',
                        flashMap[idx.symbol] === 'down' && 'flash-down',
                      )}
                    >
                      <th scope="row" className="px-3 py-2.5 pl-5 text-left font-normal">
                        <Link href={`/borsa/endeksler/${idx.symbol}`} className="group block">
                          <span className="font-medium text-foreground group-hover:text-primary">{idx.symbol}</span>
                          {INDEX_META[idx.symbol] && <span className="block text-[12px] text-muted-foreground">{INDEX_META[idx.symbol].name}</span>}
                        </Link>
                      </th>
                      <td className="num px-3 py-2.5 text-right text-foreground">{formatDecimal(idx.value)}</td>
                      <td className="px-3 py-2.5 text-right">
                        <PriceChange value={idx.changePercent} size="sm" showIcon={false} />
                      </td>
                      <td className="num hidden px-3 py-2.5 text-right text-muted-foreground sm:table-cell">{formatDecimal(idx.low)}</td>
                      <td className="num hidden px-3 py-2.5 text-right text-muted-foreground sm:table-cell">{formatDecimal(idx.high)}</td>
                      <td className="num hidden px-3 py-2.5 pr-5 text-right text-[12px] text-muted-foreground md:table-cell">{idx.time}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      <div className="mt-4">
        <DataDisclaimer variant="borsa" />
      </div>
      <AdBanner page="borsa" position="bottom" slotIndex={2} />
    </div>
  );
}
