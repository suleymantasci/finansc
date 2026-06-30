import { formatPercentTr, formatPeriodTr, type TufeEntry, type UfeEntry } from '@/lib/inflation';

interface Props {
  tufeLatest: TufeEntry | null;
  ufeLatest: UfeEntry | null;
}

export function EnflasyonSnippet({ tufeLatest, ufeLatest }: Props) {
  const tufePart =
    tufeLatest && tufeLatest.yearlyChange !== null
      ? `TÜFE yıllık ${formatPercentTr(tufeLatest.yearlyChange)}, aylık ${formatPercentTr(tufeLatest.monthlyChange)}`
      : 'TÜFE verisi yüklenemedi';
  const ufePart =
    ufeLatest && ufeLatest.yiUfeYearlyChange !== null
      ? `Yİ-ÜFE yıllık ${formatPercentTr(ufeLatest.yiUfeYearlyChange)}, aylık ${formatPercentTr(ufeLatest.yiUfeMonthlyChange)}`
      : 'ÜFE verisi yüklenemedi';
  const period =
    tufeLatest?.period
      ? formatPeriodTr(tufeLatest.period)
      : ufeLatest?.period
        ? formatPeriodTr(ufeLatest.period)
        : '';

  const text = period
    ? `${period} itibarıyla ${tufePart}; ${ufePart} oranında değişti. Kaynak: TCMB.`
    : `${tufePart}; ${ufePart}. Kaynak: TCMB.`;

  return (
    <p
      id="enflasyon-summary"
      className="mb-6 rounded-lg border-l-4 border-primary bg-primary/5 p-4 text-sm leading-relaxed"
    >
      {text}
    </p>
  );
}