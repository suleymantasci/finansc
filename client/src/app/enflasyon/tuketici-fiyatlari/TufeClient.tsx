'use client';

import { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { formatPeriodTr, formatPercentTr, type TufeEntry } from '@/lib/inflation';

interface Props {
  rows: TufeEntry[];
}

type SortKey = 'period' | 'yearlyChange' | 'monthlyChange';
type SortDir = 'asc' | 'desc';

const PAGE_SIZE = 24;

export function TufeClient({ rows }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('period');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [showAll, setShowAll] = useState(false);

  const sorted = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (av === null && bv === null) return 0;
      if (av === null) return 1;
      if (bv === null) return -1;
      if (typeof av === 'number' && typeof bv === 'number') {
        return sortDir === 'asc' ? av - bv : bv - av;
      }
      // string compare for period (MM-YYYY string sort)
      return sortDir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });
    return copy;
  }, [rows, sortKey, sortDir]);

  const visible = showAll ? sorted : sorted.slice(0, PAGE_SIZE);
  const hidden = sorted.length - visible.length;

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  }

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return <ChevronDown className="ml-1 inline h-3 w-3 opacity-30" />;
    return sortDir === 'asc' ? <ChevronUp className="ml-1 inline h-3 w-3" /> : <ChevronDown className="ml-1 inline h-3 w-3" />;
  }

  return (
    <div>
      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/50">
            <tr>
              <th className="px-3 py-2.5 text-left">
                <button
                  type="button"
                  onClick={() => toggleSort('period')}
                  className="inline-flex items-center font-semibold text-foreground hover:text-primary"
                >
                  Dönem
                  <SortIcon k="period" />
                </button>
              </th>
              <th className="px-3 py-2.5 text-right">
                <button
                  type="button"
                  onClick={() => toggleSort('yearlyChange')}
                  className="inline-flex items-center font-semibold text-foreground hover:text-primary"
                >
                  Yıllık % Değişim
                  <SortIcon k="yearlyChange" />
                </button>
              </th>
              <th className="px-3 py-2.5 text-right">
                <button
                  type="button"
                  onClick={() => toggleSort('monthlyChange')}
                  className="inline-flex items-center font-semibold text-foreground hover:text-primary"
                >
                  Aylık % Değişim
                  <SortIcon k="monthlyChange" />
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {visible.map((row, i) => (
              <tr key={row.period} className={i % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                <td className="px-3 py-2 font-medium text-foreground">{formatPeriodTr(row.period)}</td>
                <td className="px-3 py-2 text-right font-mono tabular-nums">
                  {formatPercentTr(row.yearlyChange)}
                </td>
                <td className="px-3 py-2 text-right font-mono tabular-nums">
                  {formatPercentTr(row.monthlyChange)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {hidden > 0 && !showAll && (
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-hover"
          >
            Tümünü göster ({hidden} satır daha)
          </button>
        </div>
      )}

      <p className="mt-4 text-xs text-muted-foreground">
        Toplam {rows.length} dönem. Veriler TÜİK tarafından yayımlanır, TCMB sayfasından derlenir.
      </p>
    </div>
  );
}