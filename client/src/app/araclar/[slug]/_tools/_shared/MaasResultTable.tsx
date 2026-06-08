'use client';

import type { MaasLineItem } from './maas-engine';
import { fmtTL, fmtPct } from './maas-engine';

// ── Sonuç Tablosu (Mobile-First: Card Grouping + Desktop Tablo) ──
//
// Süleyman isteği: "ekran küçük durumda tüm container genişliği
// kullanılsın, tablo net okunsun" → mobilde her satır bir card
// (2'li grid: label + amount + percent), desktop'ta klasik tablo.

export function MaasResultTable({ lines }: { lines: MaasLineItem[] }) {
  // Brüt (base) satırını bul — yüzde hesabı için
  const brut = lines.find((l) => l.kind === 'income' && !l.highlight);
  const brutAmount = brut?.amount ?? 0;

  return (
    <div className="w-full rounded-xl border border-border bg-card overflow-hidden">
      {/* Desktop tablo */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Kalem
              </th>
              <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Tutar (₺)
              </th>
              <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground w-20">
                Oran
              </th>
            </tr>
          </thead>
          <tbody>
            {lines.map((l, i) => (
              <tr
                key={i}
                className={
                  l.highlight
                    ? 'border-t-2 border-primary/20 bg-primary/5 font-bold'
                    : 'border-t border-border'
                }
              >
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-block h-2 w-2 rounded-full shrink-0 ${
                        l.kind === 'income' ? 'bg-emerald-500' : l.kind === 'deduction' ? 'bg-red-500' : l.kind === 'employer' ? 'bg-orange-500' : 'bg-blue-500'
                      }`}
                    />
                    {l.label}
                  </div>
                </td>
                <td className={`px-4 py-2.5 text-right font-mono tabular-nums ${l.amount < 0 ? 'text-emerald-600' : ''}`}>
                  {fmtTL(l.amount, 2)}
                </td>
                <td className="px-4 py-2.5 text-right text-xs text-muted-foreground">
                  {l.rate !== undefined ? fmtPct(l.rate, 2) : brutAmount > 0 ? fmtPct(l.amount / brutAmount, 2) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobil card layout — w-full, her satır kendi kartı */}
      <div className="sm:hidden divide-y divide-border">
        {lines.map((l, i) => (
          <div
            key={i}
            className={`p-3 ${l.highlight ? 'bg-primary/5' : ''}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span
                  className={`inline-block h-2 w-2 rounded-full shrink-0 mt-1 ${
                    l.kind === 'income' ? 'bg-emerald-500' : l.kind === 'deduction' ? 'bg-red-500' : l.kind === 'employer' ? 'bg-orange-500' : 'bg-blue-500'
                  }`}
                />
                <span className={`text-xs ${l.highlight ? 'font-bold' : ''} ${l.kind === 'info' ? 'text-muted-foreground' : ''}`}>
                  {l.label}
                </span>
              </div>
              <span
                className={`font-mono tabular-nums text-sm shrink-0 ${l.highlight ? 'font-bold text-base' : ''} ${
                  l.amount < 0 ? 'text-emerald-600' : l.kind === 'info' ? 'text-muted-foreground' : ''
                }`}
              >
                {fmtTL(l.amount, 2)}
              </span>
            </div>
            {(l.rate !== undefined || brutAmount > 0) && (
              <p className="mt-1 pl-4 text-[10px] text-muted-foreground">
                {l.rate !== undefined
                  ? `Oran: ${fmtPct(l.rate, 2)}`
                  : brutAmount > 0
                  ? `Brüt üzerinden: ${fmtPct(l.amount / brutAmount, 2)}`
                  : ''}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
