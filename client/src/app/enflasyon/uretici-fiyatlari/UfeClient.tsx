'use client';

import { useState } from 'react';
import { formatPeriodTr, formatPercentTr, type UfeEntry } from '@/lib/inflation';

interface Props {
  rows: UfeEntry[];
}

const PAGE_SIZE = 24;

export function UfeClient({ rows }: Props) {
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
              <th rowSpan={2} className="px-3 py-2.5 text-left font-semibold text-foreground align-bottom">
                Dönem
              </th>
              <th colSpan={2} className="px-3 py-1.5 text-center font-semibold text-foreground border-l border-border">
                Yıllık Değişim
              </th>
              <th colSpan={2} className="px-3 py-1.5 text-center font-semibold text-foreground border-l border-border">
                Aylık Değişim
              </th>
            </tr>
            <tr className="border-b border-border bg-muted/30 text-xs text-muted-foreground">
              <th className="px-3 py-1.5 text-right font-medium border-l border-border">ÜFE</th>
              <th className="px-3 py-1.5 text-right font-medium">Yİ-ÜFE</th>
              <th className="px-3 py-1.5 text-right font-medium border-l border-border">ÜFE</th>
              <th className="px-3 py-1.5 text-right font-medium">Yİ-ÜFE</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((row, i) => (
              <tr key={row.period} className={i % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                <td className="px-3 py-2 font-medium text-foreground">{formatPeriodTr(row.period)}</td>
                <td className="px-3 py-2 text-right font-mono tabular-nums border-l border-border">
                  {formatPercentTr(row.ufeYearlyChange)}
                </td>
                <td className="px-3 py-2 text-right font-mono tabular-nums">
                  {formatPercentTr(row.yiUfeYearlyChange)}
                </td>
                <td className="px-3 py-2 text-right font-mono tabular-nums border-l border-border">
                  {formatPercentTr(row.ufeMonthlyChange)}
                </td>
                <td className="px-3 py-2 text-right font-mono tabular-nums">
                  {formatPercentTr(row.yiUfeMonthlyChange)}
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
        TÜİK 2024 sonrası ÜFE yerine yalnızca Yİ-ÜFE yayımladığı için ÜFE sütunları boş olabilir.
      </p>
    </div>
  );
}