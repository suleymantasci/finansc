'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { useMarketStore } from '@/stores/market.store';
import { PriceChange } from '@/components/shared/PriceChange';
import { SearchBar } from '@/components/shared/SearchBar';
import { AdBanner } from '@/components/ads/AdBanner';
import { SkeletonTable } from '@/components/ui/Skeleton';
import { formatDecimal4 } from '@/lib/formatters';
import { CURRENCIES } from '@/lib/instruments/currencies';
import { cn } from '@/lib/utils';
import type { Currency } from '@/types';

type Tab = 'serbest-piyasa' | 'merkez-bankasi';
type SortDir = 'asc' | 'desc';
interface SortState { key: string; dir: SortDir }

const DEFAULT_SORT: SortState = { key: 'name', dir: 'asc' };

// Filter out efektif, reeskont, dünya katılım, altın entries
function isMainCurrency(c: Currency): boolean {
  const n = c.name.toLowerCase();
  return !n.startsWith('efektif') && !n.startsWith('dünya katılım') && !n.includes('altın') && !n.includes('reeskont') && !n.includes('offshore');
}

export function DovizClient() {
  const {
    serbestCurrencies,
    merkezCurrencies,
    currencyLoading,
    flashMap,
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

  // Kurlar global birleşik akıştan (LiveTicker) gelir; burada ayrı bağlantı açılmaz.
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

  const columns: { key: string; label: string; align: 'left' | 'right'; hide?: 'sm' | 'md' | 'lg' }[] = [
    { key: 'name', label: 'Döviz', align: 'left' },
    { key: 'buyPrice', label: 'Alış', align: 'right' },
    { key: 'sellPrice', label: 'Satış', align: 'right' },
    { key: 'changePercent', label: 'Değişim', align: 'right' },
    { key: 'time', label: 'Saat', align: 'right' },
  ];

  const tabs: { key: Tab; label: string }[] = [
    { key: 'serbest-piyasa', label: 'Serbest Piyasa' },
    { key: 'merkez-bankasi', label: 'Merkez Bankası' },
  ];

  // Akıştaki ad → kayıt defteri (link + TCMB birimi)
  const entryOf = (name: string) =>
    CURRENCIES.find((e) => (tab === 'serbest-piyasa' ? e.serbestName === name : e.tcmbName === name));

  return (
    <div className="mx-auto max-w-[1440px] px-4 pb-24 lg:px-8 md:pb-12">
      <AdBanner page="doviz" position="top" />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div role="group" aria-label="Kur kaynağı" className="flex gap-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              aria-pressed={tab === t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                'h-9 rounded-full px-4 text-[13px] transition-colors',
                tab === t.key ? 'bg-primary text-primary-foreground' : 'border border-border text-muted-foreground hover:text-foreground',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <SearchBar placeholder="Döviz ara (dolar, euro, sterlin)…" value={search} onChange={setSearch} className="w-full sm:max-w-xs" />
      </div>

      {isLoading ? (
        <SkeletonTable rows={15} cols={5} />
      ) : (
        <div className="atlas-card overflow-x-auto md:overflow-visible">
          <table className="w-full min-w-[560px] text-sm">
            <caption className="sr-only">{tab === 'serbest-piyasa' ? 'Serbest piyasa' : 'TCMB gösterge'} döviz kurları</caption>
            <thead className="sticky-thead">
              <tr className="border-b border-border text-[12px] text-muted-foreground">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    scope="col"
                    aria-sort={sort.key === col.key ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}
                    className={cn('whitespace-nowrap px-4 py-3 font-normal first:pl-5 last:pr-5', col.align === 'right' ? 'text-right' : 'text-left')}
                  >
                    <button type="button" onClick={() => handleSort(col.key)} className="inline-flex items-center hover:text-foreground">
                      {col.label}
                      <SortIcon active={sort.key === col.key} dir={sort.dir} />
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-5 py-10 text-center text-muted-foreground">
                    {search ? `“${search}” ile eşleşen döviz yok.` : 'Veri bulunamadı.'}
                  </td>
                </tr>
              ) : (
                filtered.map((c) => {
                  const flashKey = `currency-${tab}-${c.name}`;
                  const e = entryOf(c.name);
                  const per100 = tab === 'merkez-bankasi' && e && e.tcmbUnit !== 1;
                  const label = e?.name ?? c.name.replace(/\s{2,}/g, ' ');
                  return (
                    <tr
                      key={c.name}
                      className={cn(
                        'border-b border-border/60 last:border-0 transition-colors hover:bg-surface-hover',
                        flashMap[flashKey] === 'up' && 'flash-up',
                        flashMap[flashKey] === 'down' && 'flash-down',
                      )}
                    >
                      <th scope="row" className="px-4 py-3 pl-5 text-left font-normal">
                        {e ? (
                          <Link href={`/doviz/${e.slug}`} className="font-medium text-foreground hover:text-primary">
                            {label}
                          </Link>
                        ) : (
                          <span className="text-foreground">{label}</span>
                        )}
                        {e && <span className="ml-2 text-[11px] text-muted-foreground">{per100 ? `${e.tcmbUnit} ${e.code}` : e.code}</span>}
                      </th>
                      <td className="num px-4 py-3 text-right text-foreground/85">{formatDecimal4(c.buyPrice)}</td>
                      <td className="num px-4 py-3 text-right text-foreground">{formatDecimal4(c.sellPrice)}</td>
                      <td className="px-4 py-3 text-right">
                        <PriceChange value={c.changePercent} size="sm" showIcon={false} />
                      </td>
                      <td className="num px-4 py-3 pr-5 text-right text-[12px] text-muted-foreground">{c.time}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
      {tab === 'merkez-bankasi' && (
        <p className="mt-3 text-[12px] text-muted-foreground">TCMB bazı para birimlerini 100 birim üzerinden ilan eder; bu satırlarda birim etiketi gösterilir.</p>
      )}

      <AdBanner page="doviz" position="bottom" slotIndex={2} />
    </div>
  );
}
