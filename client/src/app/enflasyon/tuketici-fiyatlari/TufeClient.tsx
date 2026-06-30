'use client';

import { useState } from 'react';
import { formatPeriodTr, formatPercentTr, type TufeEntry } from '@/lib/inflation';

interface Props {
  rows: TufeEntry[];
}

const PAGE_SIZE = 24;

// Period "MM-YYYY" → YYYY-MM-01 Date (sortable)
function periodToDate(period: string): Date {
  const [mm, yyyy] = period.split('-');
  return new Date(parseInt(yyyy, 10), parseInt(mm, 10) - 1, 1);
}

export function TufeClient({ rows }: Props) {
  const [showAll, setShowAll] = useState(false);

  // Sıralama yok — API zaten descending dönüyor (en yeni üstte).
  // Kullanıcı isteği üzerine sort butonları kaldırıldı.
  const visible = showAll ? rows : rows.slice(0, PAGE_SIZE);
  const hidden = rows.length - visible.length;

  return (
    <div>
      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/50">
            <tr>
              <th className="px-3 py-2.5 text-left font-semibold text-foreground">Dönem</th>
              <th className="px-3 py-2.5 text-right font-semibold text-foreground">Yıllık % Değişim</th>
              <th className="px-3 py-2.5 text-right font-semibold text-foreground">Aylık % Değişim</th>
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