'use client';

import { useCallback } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { fmtTL } from './maas-engine';
import type { YearlyTableResult, MonthlyRow } from './maas-engine';

// ── 12 Aylık Yıllık Maaş Tablosu (hangikredi.com tarzı) ──────────
//
// Her ay için brüt maaş düzenlenebilir (input), hesaplama otomatik.
// Kümülatif matrah aylar arası taşınır — gelir vergisi dilimleri doğru çalışır.
// İşveren maliyeti sütunları opsiyonel gösterilir.
//
// Süleyman isteği: "her ekranda tablo olsun, kolonlar satırlar olsun,
// scroll olsun". Bu nedenle Masaüstü/mobil için ayrı render YOK —
// tek <table>, w-full, overflow-x-auto ile yatay scroll. Body padding
// ve text boyutu küçültüldü (px-1.5 py-1 / sm:px-3 sm:py-2.5), böylece
// dar ekranda daha fazla sütun görünür.

interface Props {
  yearlyResult: YearlyTableResult;
  monthlyAmounts: number[];
  onMonthAmountChange: (month: number, amount: number) => void;
  showEmployer: boolean;
  onPdfDownload?: () => void;
  direction: 'brutten-nete' | 'netten-brute';
}

export function YearlyMaasTable({
  yearlyResult,
  monthlyAmounts,
  onMonthAmountChange,
  showEmployer,
  onPdfDownload,
  direction,
}: Props) {
  const { rows, totals } = yearlyResult;

  const handleAmountChange = useCallback(
    (monthIndex: number, value: string) => {
      const num = parseFloat(value.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
      onMonthAmountChange(monthIndex, num);
    },
    [onMonthAmountChange],
  );

  return (
    <div className="w-full space-y-3">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-base sm:text-lg font-bold">
          {direction === 'brutten-nete' ? 'Brütten Nete' : 'Netten Brüte'} Maaş Hesabı Tablosu
        </h2>
        {onPdfDownload && (
          <Button
            type="button"
            onClick={onPdfDownload}
            variant="outline"
            className="gap-1.5 text-xs sm:text-sm self-start sm:self-auto shrink-0"
            aria-label="Sonucu PDF olarak indir"
          >
            <Download className="h-4 w-4" />
            PDF
          </Button>
        )}
      </div>

      {/* Tablo — her ekranda aynı, sadece yatay scroll */}
      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-xs sm:text-sm min-w-[720px]">
          <thead className="bg-muted">
            <tr>
              <th className="px-1.5 py-2 sm:px-3 sm:py-2.5 text-left text-[10px] sm:text-xs font-semibold text-muted-foreground">
                Ay
              </th>
              <th className="px-1.5 py-2 sm:px-3 sm:py-2.5 text-left text-[10px] sm:text-xs font-semibold text-muted-foreground min-w-[120px] sm:min-w-[140px]">
                {direction === 'brutten-nete' ? 'Brüt Maaş' : 'Net Maaş'}
              </th>
              <th className="px-1.5 py-2 sm:px-3 sm:py-2.5 text-right text-[10px] sm:text-xs font-semibold text-muted-foreground">
                {direction === 'brutten-nete' ? 'Net Maaş' : 'Brüt Maaş'}
              </th>
              <th className="px-1.5 py-2 sm:px-3 sm:py-2.5 text-right text-[10px] sm:text-xs font-semibold text-muted-foreground whitespace-nowrap">
                Gelir Vergisi
              </th>
              <th className="px-1.5 py-2 sm:px-3 sm:py-2.5 text-right text-[10px] sm:text-xs font-semibold text-muted-foreground whitespace-nowrap">
                İşsizlik
              </th>
              <th className="px-1.5 py-2 sm:px-3 sm:py-2.5 text-right text-[10px] sm:text-xs font-semibold text-muted-foreground whitespace-nowrap">
                Damga
              </th>
              <th className="px-1.5 py-2 sm:px-3 sm:py-2.5 text-right text-[10px] sm:text-xs font-semibold text-muted-foreground whitespace-nowrap">
                SGK Primi
              </th>
              {showEmployer && (
                <>
                  <th className="px-1.5 py-2 sm:px-3 sm:py-2.5 text-right text-[10px] sm:text-xs font-semibold text-muted-foreground whitespace-nowrap">
                    SGK İşv.
                  </th>
                  <th className="px-1.5 py-2 sm:px-3 sm:py-2.5 text-right text-[10px] sm:text-xs font-semibold text-muted-foreground whitespace-nowrap">
                    İşsz. İşv.
                  </th>
                  <th className="px-1.5 py-2 sm:px-3 sm:py-2.5 text-right text-[10px] sm:text-xs font-semibold text-muted-foreground whitespace-nowrap">
                    Toplam Maliyet
                  </th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={row.month} className="border-t border-border hover:bg-muted/30">
                <td className="px-1.5 py-1.5 sm:px-3 sm:py-2 font-medium text-xs sm:text-sm whitespace-nowrap">
                  {row.monthName}
                </td>
                <td className="px-1 py-1 sm:px-2 sm:py-1">
                  <div className="relative">
                    <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[10px] sm:text-xs text-muted-foreground">
                      ₺
                    </span>
                    <input
                      type="text"
                      inputMode="decimal"
                      className="w-full rounded-md border border-border bg-background pl-5 sm:pl-6 pr-1.5 sm:pr-2 py-1 sm:py-1.5 text-right text-xs sm:text-sm num focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                      value={monthlyAmounts[idx] > 0 ? monthlyAmounts[idx].toLocaleString('tr-TR', { minimumFractionDigits: 2 }) : '0,00'}
                      onChange={(e) => handleAmountChange(idx, e.target.value)}
                    />
                  </div>
                </td>
                <NumCell value={direction === 'brutten-nete' ? row.net : row.gross} highlight={row.gross > 0} />
                <NumCell value={row.incomeTax} />
                <NumCell value={row.unemployment} />
                <NumCell value={row.stampTax} />
                <NumCell value={row.sgkEmployee} />
                {showEmployer && (
                  <>
                    <NumCell value={row.sgkEmployer} />
                    <NumCell value={row.unemploymentEmployer} />
                    <NumCell value={row.totalEmployerCost} />
                  </>
                )}
              </tr>
            ))}
            {/* Toplam satırı */}
            <tr className="border-t-2 border-primary/30 bg-primary/5 font-bold">
              <td className="px-1.5 py-2 sm:px-3 sm:py-2.5 text-xs sm:text-sm whitespace-nowrap">Toplam</td>
              <td className="px-1.5 py-2 sm:px-3 sm:py-2.5 text-right num text-xs sm:text-sm">
                {fmtNum(direction === 'brutten-nete' ? totals.gross : totals.net)}
              </td>
              <td className="px-1.5 py-2 sm:px-3 sm:py-2.5 text-right num text-xs sm:text-sm text-emerald-600 dark:text-emerald-400">
                {fmtNum(direction === 'brutten-nete' ? totals.net : totals.gross)}
              </td>
              <td className="px-1.5 py-2 sm:px-3 sm:py-2.5 text-right num text-xs sm:text-sm">
                {fmtNum(totals.incomeTax)}
              </td>
              <td className="px-1.5 py-2 sm:px-3 sm:py-2.5 text-right num text-xs sm:text-sm">
                {fmtNum(totals.unemployment)}
              </td>
              <td className="px-1.5 py-2 sm:px-3 sm:py-2.5 text-right num text-xs sm:text-sm">
                {fmtNum(totals.stampTax)}
              </td>
              <td className="px-1.5 py-2 sm:px-3 sm:py-2.5 text-right num text-xs sm:text-sm">
                {fmtNum(totals.sgkEmployee)}
              </td>
              {showEmployer && (
                <>
                  <td className="px-1.5 py-2 sm:px-3 sm:py-2.5 text-right num text-xs sm:text-sm">
                    {fmtNum(totals.sgkEmployer)}
                  </td>
                  <td className="px-1.5 py-2 sm:px-3 sm:py-2.5 text-right num text-xs sm:text-sm">
                    {fmtNum(totals.unemploymentEmployer)}
                  </td>
                  <td className="px-1.5 py-2 sm:px-3 sm:py-2.5 text-right num text-xs sm:text-sm">
                    {fmtNum(totals.totalEmployerCost)}
                  </td>
                </>
              )}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Alt Bileşenler ───────────────────────────────────────────────

function NumCell({ value, highlight }: { value: number; highlight?: boolean }) {
  return (
    <td
      className={`px-1.5 py-1.5 sm:px-3 sm:py-2 text-right num text-xs sm:text-sm whitespace-nowrap ${
        highlight ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-muted-foreground'
      } ${value === 0 ? 'opacity-40' : ''}`}
    >
      {fmtNum(value)}
    </td>
  );
}

function fmtNum(v: number): string {
  return v.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
