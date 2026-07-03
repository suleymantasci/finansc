'use client';

import { Select } from '@/components/ui/Select';

export interface MonthYearValue {
  year: number;
  month: number; // 1-12
}

interface MonthYearPickerProps {
  label: string;
  value: MonthYearValue;
  onChange: (v: MonthYearValue) => void;
  /** Min yıl (default: 2003 — tasci-api TÜFE baz yılı) */
  minYear?: number;
  /** Max yıl (default: şu anki yıl) */
  maxYear?: number;
  /** Max ay (default: 12). Geleceğe dönük hesap istemiyorsan şu anki ay ver. */
  maxMonth?: number;
  error?: string;
  /** id suffix (input/select id çakışmasın diye parent key önerilir) */
  idSuffix?: string;
}

// MaasHesaplama pattern'i: ayları locale ile yaz.
const MONTHS = Array.from({ length: 12 }, (_, i) => {
  const m = i + 1;
  return {
    value: String(m),
    label: new Date(2000, i, 1).toLocaleDateString('tr-TR', { month: 'long' }),
  };
});

/**
 * Ay+Yıl seçici — 2 ayrı <Select>, site ile bütünlük.
 * Native <input type="date"> kullanmaz (mobil + tasarım tutarsız).
 */
export function MonthYearPicker({
  label,
  value,
  onChange,
  minYear = 2003,
  maxYear,
  maxMonth = 12,
  error,
  idSuffix,
}: MonthYearPickerProps) {
  const currentYear = new Date().getFullYear();
  const effectiveMaxYear = maxYear ?? currentYear;

  const years = Array.from(
    { length: effectiveMaxYear - minYear + 1 },
    (_, i) => {
      const y = effectiveMaxYear - i;
      return { value: String(y), label: String(y) };
    },
  );

  // Eğer seçili yıl maxYear ise, ay listesini maxMonth'e kadar kıs.
  const monthsAvailable =
    value.year === effectiveMaxYear
      ? MONTHS.slice(0, maxMonth)
      : MONTHS;

  return (
    <div className="w-full space-y-1.5">
      <div className="grid grid-cols-2 gap-3">
        <Select
          label={idSuffix ? `${label} — Yıl` : 'Yıl'}
          options={years}
          value={String(value.year)}
          onChange={(e) =>
            onChange({ year: Number(e.target.value), month: value.month })
          }
          error={error}
        />
        <Select
          label={idSuffix ? `${label} — Ay` : 'Ay'}
          options={monthsAvailable}
          value={String(value.month)}
          onChange={(e) =>
            onChange({ year: value.year, month: Number(e.target.value) })
          }
        />
      </div>
    </div>
  );
}