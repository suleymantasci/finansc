import {
  formatPercentTr,
  formatPeriodTr,
  type TufeEntry,
  type UfeEntry,
} from '@/lib/inflation';

interface Props {
  tufe: TufeEntry[] | null;
  ufe: UfeEntry[] | null;
  /** Kaç ay gösterileceği (default 12) */
  months?: number;
}

interface Row {
  period: string;
  tufe: TufeEntry | null;
  ufe: UfeEntry | null;
}

export function EnflasyonCompareTable({ tufe, ufe, months = 12 }: Props) {
  if (!tufe && !ufe) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
        Karşılaştırma tablosu için veri yüklenemedi.
      </div>
    );
  }

  // Tufe ve ufe farklı uzunlukta olabilir, period'a göre join
  const tufeByPeriod = new Map<string, TufeEntry>();
  const ufeByPeriod = new Map<string, UfeEntry>();
  for (const t of tufe || []) tufeByPeriod.set(t.period, t);
  for (const u of ufe || []) ufeByPeriod.set(u.period, u);

  const periods = Array.from(
    new Set<string>([...tufeByPeriod.keys(), ...ufeByPeriod.keys()]),
  )
    .sort((a, b) => (a > b ? -1 : 1)) // descending: MM-YYYY string sort works
    .slice(0, months);

  const rows: Row[] = periods.map((period) => ({
    period,
    tufe: tufeByPeriod.get(period) || null,
    ufe: ufeByPeriod.get(period) || null,
  }));

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <table className="w-full text-sm">
        <thead className="border-b border-border bg-muted/50">
          <tr>
            <th className="px-3 py-2.5 text-left font-semibold text-foreground">Dönem</th>
            <th colSpan={2} className="px-3 py-2.5 text-center font-semibold text-primary border-l border-border">
              TÜFE
            </th>
            <th colSpan={2} className="px-3 py-2.5 text-center font-semibold text-blue-600 dark:text-blue-400 border-l border-border">
              Yİ-ÜFE
            </th>
          </tr>
          <tr className="border-b border-border bg-muted/30 text-xs text-muted-foreground">
            <th className="px-3 py-1.5"></th>
            <th className="px-3 py-1.5 text-right font-medium border-l border-border">Yıllık</th>
            <th className="px-3 py-1.5 text-right font-medium">Aylık</th>
            <th className="px-3 py-1.5 text-right font-medium border-l border-border">Yıllık</th>
            <th className="px-3 py-1.5 text-right font-medium">Aylık</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={row.period}
              className={i % 2 === 0 ? 'bg-background' : 'bg-muted/20'}
            >
              <td className="px-3 py-2 font-medium text-foreground">{formatPeriodTr(row.period)}</td>
              <td className="px-3 py-2 text-right font-mono tabular-nums border-l border-border">
                {formatPercentTr(row.tufe?.yearlyChange ?? null)}
              </td>
              <td className="px-3 py-2 text-right font-mono tabular-nums">
                {formatPercentTr(row.tufe?.monthlyChange ?? null)}
              </td>
              <td className="px-3 py-2 text-right font-mono tabular-nums border-l border-border">
                {formatPercentTr(row.ufe?.yiUfeYearlyChange ?? null)}
              </td>
              <td className="px-3 py-2 text-right font-mono tabular-nums">
                {formatPercentTr(row.ufe?.yiUfeMonthlyChange ?? null)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}