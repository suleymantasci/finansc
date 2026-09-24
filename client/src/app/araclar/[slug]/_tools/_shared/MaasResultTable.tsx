'use client';

import type { MaasLineItem } from './maas-engine';
import { fmtTL, fmtPct } from './maas-engine';

// ── Sonuç Tablosu (Mobil + Desktop aynı görünüm) ──
//
// Süleyman isteği: "masaüstündeki tablo mobilde de aynı görünsün,
// ayrı bir card layout olmasın." Tek tablo, w-full, overflow-x-auto
// ile çok dar ekranlarda yatay scroll. Padding küçültüldü (sm:px-3
// px-2), text-xs/num sıkı tipografi.

export function MaasResultTable({ lines }: { lines: MaasLineItem[] }) {
  // Brüt (base) satırını bul — yüzde hesabı için
  const brut = lines.find((l) => l.kind === 'income' && !l.highlight);
  const brutAmount = brut?.amount ?? 0;

  return (
    <div className="w-full atlas-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="px-2 py-2 sm:px-4 sm:py-2.5 text-left text-[10px] sm:text-[12px] font-medium text-muted-foreground">
                Kalem
              </th>
              <th className="px-2 py-2 sm:px-4 sm:py-2.5 text-right text-[10px] sm:text-[12px] font-medium text-muted-foreground">
                Tutar (₺)
              </th>
              <th className="px-2 py-2 sm:px-4 sm:py-2.5 text-right text-[10px] sm:text-[12px] font-medium text-muted-foreground w-16 sm:w-20">
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
                <td className="px-2 py-2 sm:px-4 sm:py-2.5">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <span
                      className={`inline-block h-2 w-2 rounded-full shrink-0 ${
                        l.kind === 'income' ? 'bg-emerald-500' : l.kind === 'deduction' ? 'bg-red-500' : l.kind === 'employer' ? 'bg-orange-500' : 'bg-blue-500'
                      }`}
                    />
                    <span className="text-xs sm:text-sm whitespace-nowrap">{l.label}</span>
                  </div>
                </td>
                <td
                  className={`px-2 py-2 sm:px-4 sm:py-2.5 text-right num text-xs sm:text-sm whitespace-nowrap ${
                    l.amount < 0 ? 'text-emerald-600' : ''
                  }`}
                >
                  {fmtTL(l.amount, 2)}
                </td>
                <td className="px-2 py-2 sm:px-4 sm:py-2.5 text-right text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap">
                  {l.rate !== undefined ? fmtPct(l.rate, 2) : brutAmount > 0 ? fmtPct(l.amount / brutAmount, 2) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
