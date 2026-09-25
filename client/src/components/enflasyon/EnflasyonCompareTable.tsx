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
      <div className="atlas-card p-6 text-sm text-muted-foreground">
        Karşılaştırma tablosu için veri yüklenemedi.
      </div>
    );
  }

  // Tufe ve ufe farklı uzunlukta olabilir, period'a göre join
  const tufeByPeriod = new Map<string, TufeEntry>();
  const ufeByPeriod = new Map<string, UfeEntry>();
  for (const t of tufe || []) tufeByPeriod.set(t.period, t);
  for (const u of ufe || []) ufeByPeriod.set(u.period, u);

  // Sıralama — upstream descending (en yeni üstte) dönüyor.
// MM-YYYY string sort YANLIŞ (alfabetik), bu yüzden tek tek Date kontrolü.
// Performans: 257 satır için O(n log n) kabul edilebilir, Date parse ucuz.
  const periods = Array.from(
    new Set<string>([...tufeByPeriod.keys(), ...ufeByPeriod.keys()]),
  )
    .map((p) => {
      const [mm, yyyy] = p.split('-');
      // YYYY-MM-01 → ISO parse (timezone-independent, doğru kronoloji)
      return { key: p, date: new Date(parseInt(yyyy, 10), parseInt(mm, 10) - 1, 1).getTime() };
    })
    .sort((a, b) => b.date - a.date)
    .slice(0, months)
    .map((p) => p.key);

  const rows: Row[] = periods.map((period) => ({
    period,
    tufe: tufeByPeriod.get(period) || null,
    ufe: ufeByPeriod.get(period) || null,
  }));

  return (
    <div className="overflow-x-auto atlas-card">
      <table className="w-full text-sm">
        <thead className="border-b border-border bg-elevated/50">
          <tr>
            <th className="px-2 sm:px-3 py-2.5 text-left font-semibold text-foreground">Dönem</th>
            <th colSpan={2} className="px-2 sm:px-3 py-2.5 text-center font-semibold text-primary border-l border-border">
              TÜFE
            </th>
            <th colSpan={2} className="px-2 sm:px-3 py-2.5 text-center font-semibold text-blue-600 dark:text-blue-400 border-l border-border">
              Yİ-ÜFE
            </th>
          </tr>
          <tr className="border-b border-border bg-elevated/30 text-xs text-muted-foreground">
            <th className="px-2 sm:px-3 py-1.5"></th>
            <th className="px-2 sm:px-3 py-1.5 text-right font-medium border-l border-border">Yıllık</th>
            <th className="px-2 sm:px-3 py-1.5 text-right font-medium">Aylık</th>
            <th className="px-2 sm:px-3 py-1.5 text-right font-medium border-l border-border">Yıllık</th>
            <th className="px-2 sm:px-3 py-1.5 text-right font-medium">Aylık</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={row.period}
              className={i % 2 === 0 ? 'bg-background' : 'bg-muted/20'}
            >
              <td className="px-2 sm:px-3 py-2 font-medium text-foreground">{formatPeriodTr(row.period)}</td>
              <td className="px-2 sm:px-3 py-2 text-right num border-l border-border">
                {formatPercentTr(row.tufe?.yearlyChange ?? null)}
              </td>
              <td className="px-2 sm:px-3 py-2 text-right num">
                {formatPercentTr(row.tufe?.monthlyChange ?? null)}
              </td>
              <td className="px-2 sm:px-3 py-2 text-right num border-l border-border">
                {formatPercentTr(row.ufe?.yiUfeYearlyChange ?? null)}
              </td>
              <td className="px-2 sm:px-3 py-2 text-right num">
                {formatPercentTr(row.ufe?.yiUfeMonthlyChange ?? null)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}