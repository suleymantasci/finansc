'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { useMarketStore } from '@/stores/market.store';
import type { CurrencyStreamData } from '@/stores/market.store';
import { useSSE } from '@/hooks/useSSE';
import { SectionIntro } from '@/components/shared/SectionIntro';
import { PriceChange } from '@/components/shared/PriceChange';
import { MarketStatus } from '@/components/shared/MarketStatus';
import { SearchBar } from '@/components/shared/SearchBar';
import { AdBanner } from '@/components/ads/AdBanner';
import { SkeletonTable } from '@/components/ui/Skeleton';
import { formatDecimal4 } from '@/lib/formatters';
import { currencyNameToCode, getCurrencyByCode, CURRENCY_META } from '@/lib/seo-data/currency';
import { cn } from '@/lib/utils';
import type { Currency } from '@/types';

type Tab = 'serbest-piyasa' | 'merkez-bankasi';
type SortDir = 'asc' | 'desc';
interface SortState { key: string; dir: SortDir }

const DEFAULT_SORT: SortState = { key: 'name', dir: 'asc' };

// Filter out efektif, reeskont, dünya katılım, altın entries
function isMainCurrency(c: Currency): boolean {
  const n = c.name.toLowerCase();
  return !n.startsWith('efektif') && !n.startsWith('dünya katılım') && !n.includes('altın');
}

export function DovizClient() {
  const {
    serbestCurrencies,
    merkezCurrencies,
    currencyLoading,
    flashMap,
    updateFromCurrencyStream,
    setCurrencyStreamStatus,
  } = useMarketStore();

  const router = useRouter();
  const searchParams = useSearchParams();

  const tab = (searchParams.get('kaynak') as Tab) || 'serbest-piyasa';
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortState>(DEFAULT_SORT);

  const setTab = useCallback((newTab: Tab) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newTab === 'serbest-piyasa') {
      params.delete('kaynak');
    } else {
      params.set('kaynak', newTab);
    }
    router.replace(`/doviz${params.size ? `?${params}` : ''}`, { scroll: false });
  }, [router, searchParams]);

  // SSE for serbest piyasa (30s updates)
  const handleSerbestSSE = useCallback(
    (data: unknown) => {
      updateFromCurrencyStream('serbest-piyasa', data as CurrencyStreamData);
    },
    [updateFromCurrencyStream],
  );

  // SSE for merkez bankası (hourly updates)
  const handleMerkezSSE = useCallback(
    (data: unknown) => {
      updateFromCurrencyStream('merkez-bankasi', data as CurrencyStreamData);
    },
    [updateFromCurrencyStream],
  );

  const { status: serbestStatus } = useSSE({
    url: '/api/market/currency/serbest-piyasa/stream',
    onMessage: handleSerbestSSE,
  });

  const { status: merkezStatus } = useSSE({
    url: '/api/market/currency/merkez-bankasi/stream',
    onMessage: handleMerkezSSE,
  });

  useEffect(() => {
    setCurrencyStreamStatus(tab === 'serbest-piyasa' ? serbestStatus : merkezStatus);
  }, [tab, serbestStatus, merkezStatus, setCurrencyStreamStatus]);

  const displayStatus = tab === 'serbest-piyasa' ? serbestStatus : merkezStatus;
  const currencies = tab === 'serbest-piyasa' ? serbestCurrencies : merkezCurrencies;

  const handleSort = (key: string) => {
    setSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { key, dir: key === 'name' ? 'asc' : 'desc' },
    );
  };

  const SortIcon = ({ active, dir }: { active: boolean; dir?: SortDir }) => {
    if (!active) return <ArrowUpDown className="ml-1 inline h-3 w-3 opacity-30" />;
    if (dir === 'asc') return <ArrowUp className="ml-1 inline h-3 w-3 text-primary" />;
    return <ArrowDown className="ml-1 inline h-3 w-3 text-primary" />;
  };

  const filtered = useMemo(() => {
    let result = currencies.filter(isMainCurrency);

    if (search) {
      const q = search.toLowerCase();
      result = result.filter((c) => c.name.toLowerCase().includes(q));
    }

    return [...result].sort((a, b) => {
      const aVal = a[sort.key as keyof Currency];
      const bVal = b[sort.key as keyof Currency];
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        const cmp = aVal.localeCompare(bVal, 'tr');
        return sort.dir === 'asc' ? cmp : -cmp;
      }
      const cmp = ((aVal as number) ?? 0) - ((bVal as number) ?? 0);
      return sort.dir === 'asc' ? cmp : -cmp;
    });
  }, [currencies, search, sort]);

  const isLoading = currencyLoading && currencies.length === 0;

  const columns = [
    { key: 'name', label: 'Döviz', align: 'left' as const },
    { key: 'buyPrice', label: 'Alış', align: 'right' as const },
    { key: 'sellPrice', label: 'Satış', align: 'right' as const },
    { key: 'changePercent', label: 'Değişim', align: 'right' as const },
    { key: 'time', label: 'Saat', align: 'right' as const, hide: 'sm' as const },
  ];

  const tabs: { key: Tab; label: string }[] = [
    { key: 'serbest-piyasa', label: 'Serbest Piyasa' },
    { key: 'merkez-bankasi', label: 'Merkez Bankası' },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8 pb-20 md:pb-8">
      <div className="flex items-start justify-between gap-4 mb-6">
        <SectionIntro
          title="Döviz Kurları"
          description="Anlık döviz kurlarını canlı takip edin"
        />
        <MarketStatus status={displayStatus} />
      </div>

      <AdBanner page="doviz" position="top" />

      {/* Tabs */}
      <div className="border-b border-border mb-6">
        <nav className="flex gap-8">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                'pb-3 text-sm font-semibold transition-colors border-b-2 -mb-px',
                tab === t.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-end gap-4">
        <SearchBar
          placeholder="Döviz ara... (Dolar, Euro, Sterlin)"
          value={search}
          onChange={setSearch}
          className="max-w-sm"
        />
      </div>

      {isLoading ? (
        <SkeletonTable rows={15} cols={5} />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className={cn(
                      'px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors whitespace-nowrap',
                      col.align === 'right' ? 'text-right' : 'text-left',
                      col.hide && `hidden ${col.hide}:table-cell`,
                    )}
                  >
                    {col.label}
                    <SortIcon active={sort.key === col.key} dir={sort.dir} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-8 text-center text-muted-foreground">
                    Veri bulunamadı
                  </td>
                </tr>
              ) : (
                filtered.map((c) => {
                  const flashKey = `currency-${tab}-${c.name}`;
                  return (
                    <tr
                      key={c.name}
                      className={cn(
                        'border-b border-border last:border-0 transition-colors hover:bg-surface-hover',
                        flashMap[flashKey] === 'up' && 'flash-up',
                        flashMap[flashKey] === 'down' && 'flash-down',
                      )}
                    >
                      <td className="px-4 py-3 font-medium">
                        {(() => {
                          const code = currencyNameToCode(c.name);
                          const meta = code ? CURRENCY_META[code] : null;
                          if (meta) {
                            return (
                              <Link
                                href={`/doviz/${meta.slug}`}
                                className="text-primary hover:underline"
                              >
                                {c.name}
                              </Link>
                            );
                          }
                          return c.name;
                        })()}
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums">{formatDecimal4(c.buyPrice)}</td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums">{formatDecimal4(c.sellPrice)}</td>
                      <td className="px-4 py-3 text-right"><PriceChange value={c.changePercent} size="sm" /></td>
                      <td className={cn('px-4 py-3 text-right text-xs text-muted-foreground hidden sm:table-cell')}>
                        {c.time}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      <AdBanner page="doviz" position="bottom" slotIndex={2} />
    </div>
  );
}
