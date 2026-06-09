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

      {/* Tablo */}
      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        {/* Desktop Tablo */}
        <table className="hidden lg:table w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground">Ay</th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground min-w-[140px]">
                {direction === 'brutten-nete' ? 'Brüt Maaş' : 'Net Maaş'}
              </th>
              <th className="px-3 py-2.5 text-right text-xs font-semibold text-muted-foreground">
                {direction === 'brutten-nete' ? 'Net Maaş' : 'Brüt Maaş'}
              </th>
              <th className="px-3 py-2.5 text-right text-xs font-semibold text-muted-foreground">Aylık Gelir<br/>Vergisi</th>
              <th className="px-3 py-2.5 text-right text-xs font-semibold text-muted-foreground">İşsizlik<br/>Sigortası</th>
              <th className="px-3 py-2.5 text-right text-xs font-semibold text-muted-foreground">Damga<br/>Vergisi</th>
              <th className="px-3 py-2.5 text-right text-xs font-semibold text-muted-foreground">Çalışan SGK<br/>Primi</th>
              {showEmployer && (
                <>
                  <th className="px-3 py-2.5 text-right text-xs font-semibold text-muted-foreground">SGK İşveren<br/>Primi</th>
                  <th className="px-3 py-2.5 text-right text-xs font-semibold text-muted-foreground">İşsizlik<br/>İşveren</th>
                  <th className="px-3 py-2.5 text-right text-xs font-semibold text-muted-foreground">Toplam<br/>Maliyet</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={row.month} className="border-t border-border hover:bg-muted/30">
                <td className="px-3 py-2 font-medium text-sm">{row.monthName}</td>
                <td className="px-1 py-1">
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">₺</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      className="w-full rounded-md border border-border bg-background px-2 py-1.5 pl-6 text-right text-sm font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
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
              <td className="px-3 py-2.5 text-sm">Toplam</td>
              <td className="px-3 py-2.5 text-right font-mono tabular-nums text-sm">
                {fmtNum(direction === 'brutten-nete' ? totals.gross : totals.net)}
              </td>
              <td className="px-3 py-2.5 text-right font-mono tabular-nums text-sm text-emerald-600 dark:text-emerald-400">
                {fmtNum(direction === 'brutten-nete' ? totals.net : totals.gross)}
              </td>
              <td className="px-3 py-2.5 text-right font-mono tabular-nums text-sm">{fmtNum(totals.incomeTax)}</td>
              <td className="px-3 py-2.5 text-right font-mono tabular-nums text-sm">{fmtNum(totals.unemployment)}</td>
              <td className="px-3 py-2.5 text-right font-mono tabular-nums text-sm">{fmtNum(totals.stampTax)}</td>
              <td className="px-3 py-2.5 text-right font-mono tabular-nums text-sm">{fmtNum(totals.sgkEmployee)}</td>
              {showEmployer && (
                <>
                  <td className="px-3 py-2.5 text-right font-mono tabular-nums text-sm">{fmtNum(totals.sgkEmployer)}</td>
                  <td className="px-3 py-2.5 text-right font-mono tabular-nums text-sm">{fmtNum(totals.unemploymentEmployer)}</td>
                  <td className="px-3 py-2.5 text-right font-mono tabular-nums text-sm">{fmtNum(totals.totalEmployerCost)}</td>
                </>
              )}
            </tr>
          </tbody>
        </table>

        {/* Mobil Card Layout */}
        <div className="lg:hidden divide-y divide-border">
          {rows.map((row, idx) => (
            <MobileMonthCard
              key={row.month}
              row={row}
              amount={monthlyAmounts[idx]}
              onAmountChange={(v) => handleAmountChange(idx, v)}
              showEmployer={showEmployer}
              direction={direction}
            />
          ))}
          {/* Mobil Toplam */}
          <div className="p-4 bg-primary/5">
            <p className="font-bold text-sm mb-2">Yıllık Toplam</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <MobileStat label="Brüt" value={totals.gross} />
              <MobileStat label="Net" value={totals.net} highlight />
              <MobileStat label="Gelir Vergisi" value={totals.incomeTax} />
              <MobileStat label="SGK Primi" value={totals.sgkEmployee} />
              <MobileStat label="İşsizlik" value={totals.unemployment} />
              <MobileStat label="Damga" value={totals.stampTax} />
              {showEmployer && (
                <>
                  <MobileStat label="SGK İşveren" value={totals.sgkEmployer} />
                  <MobileStat label="İşveren Toplam" value={totals.totalEmployerCost} />
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Alt Bileşenler ───────────────────────────────────────────────

function NumCell({ value, highlight }: { value: number; highlight?: boolean }) {
  return (
    <td
      className={`px-3 py-2 text-right font-mono tabular-nums text-sm ${
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

function MobileMonthCard({
  row,
  amount,
  onAmountChange,
  showEmployer,
  direction,
}: {
  row: MonthlyRow;
  amount: number;
  onAmountChange: (v: string) => void;
  showEmployer: boolean;
  direction: 'brutten-nete' | 'netten-brute';
}) {
  return (
    <div className={`p-3 ${row.gross > 0 ? '' : 'opacity-50'}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold text-sm">{row.monthName}</span>
        <div className="relative w-32">
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">₺</span>
          <input
            type="text"
            inputMode="decimal"
            className="w-full rounded-md border border-border bg-background px-2 py-1 pl-6 text-right text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary/30"
            value={amount > 0 ? amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 }) : '0,00'}
            onChange={(e) => onAmountChange(e.target.value)}
          />
        </div>
      </div>
      {row.gross > 0 && (
        <div className="grid grid-cols-2 gap-1.5 text-xs">
          <MobileStat label={direction === 'brutten-nete' ? 'Net' : 'Brüt'} value={direction === 'brutten-nete' ? row.net : row.gross} highlight />
          <MobileStat label="Gelir Vergisi" value={row.incomeTax} />
          <MobileStat label="SGK" value={row.sgkEmployee} />
          <MobileStat label="İşsizlik" value={row.unemployment} />
          <MobileStat label="Damga" value={row.stampTax} />
          {showEmployer && <MobileStat label="İşveren" value={row.totalEmployerCost} />}
        </div>
      )}
    </div>
  );
}

function MobileStat({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-mono tabular-nums ${highlight ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : ''}`}>
        {fmtNum(value)}
      </span>
    </div>
  );
}
