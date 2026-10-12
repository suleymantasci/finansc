import { cn } from '@/lib/utils';
import { fmtDate, fmtNum, fmtPct, priceStatsSentence, type PriceLabel, type PriceStats as Stats } from '@/lib/price-stats';

const tone = (v: number | null) => (v == null ? 'text-muted-foreground' : v > 0 ? 'text-up' : v < 0 ? 'text-down' : 'text-neutral');

/** Altın/döviz/emtia performans özeti — sunucuda çizilir (Google ve yapay zekâ tarayıcıları için sayısal içerik). */
export function PriceStats({ s, label, id = 'price-stats' }: { s: Stats; label: PriceLabel; id?: string }) {
  const d = label.decimals ?? 2;
  const rows = s.periods.filter((p) => p.pct != null);
  return (
    <section aria-labelledby={id} className="atlas-card overflow-clip">
      <div className="flex flex-wrap items-baseline justify-between gap-2 px-5 pt-5 sm:px-6">
        <h2 id={id} className="font-display text-2xl text-foreground">
          {label.name} performans özeti
        </h2>
        <span className="text-[12px] text-muted-foreground">{fmtDate(s.asOf)} kapanışına göre</span>
      </div>
      <p className="px-5 pt-3 text-sm leading-relaxed text-muted-foreground sm:px-6">{priceStatsSentence(label, s)}</p>

      <div className="mt-4 grid gap-px border-t border-border bg-border sm:grid-cols-2">
        {rows.length > 0 && (
          <table className="w-full bg-card text-sm">
            <caption className="sr-only">{label.name} dönemsel değişim</caption>
            <thead>
              <tr className="border-b border-border text-[12px] text-muted-foreground">
                <th scope="col" className="px-5 py-2.5 text-left font-normal sm:px-6">Dönem</th>
                <th scope="col" className="px-5 py-2.5 text-right font-normal sm:px-6">Değişim</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.key} className="border-b border-border/60 last:border-0">
                  <th scope="row" className="px-5 py-2.5 text-left font-normal text-foreground sm:px-6">{p.label}</th>
                  <td className={cn('num px-5 py-2.5 text-right font-medium sm:px-6', tone(p.pct))}>{fmtPct(p.pct)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="bg-card px-5 py-4 sm:px-6">
          <p className="text-[12px] text-muted-foreground">52 haftalık aralık</p>
          <p className="num mt-1 text-[15px] text-foreground">
            {fmtNum(s.low52.value, d)} – {fmtNum(s.high52.value, d)} {label.unit}
          </p>
          <div className="relative mt-3 h-1.5 rounded-full bg-muted" aria-hidden="true">
            <span
              className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-card bg-primary"
              style={{ left: `${Math.min(100, Math.max(0, s.rangePos))}%` }}
            />
          </div>
          <p className="mt-2 text-[12px] text-muted-foreground">
            Son kapanış {fmtNum(s.last, d)} {label.unit} · aralığın %{Math.round(s.rangePos)} seviyesi
          </p>
          <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-[13px]">
            <div>
              <dt className="text-[12px] text-muted-foreground">52 hafta en yüksek</dt>
              <dd className="num mt-0.5 text-foreground">{fmtNum(s.high52.value, d)}</dd>
              <dd className="text-[11px] text-muted-foreground">{fmtDate(s.high52.date)}</dd>
            </div>
            <div>
              <dt className="text-[12px] text-muted-foreground">52 hafta en düşük</dt>
              <dd className="num mt-0.5 text-foreground">{fmtNum(s.low52.value, d)}</dd>
              <dd className="text-[11px] text-muted-foreground">{fmtDate(s.low52.date)}</dd>
            </div>
          </dl>
        </div>
      </div>
      <p className="border-t border-border px-5 py-3 text-[11px] text-muted-foreground sm:px-6">
        Günlük kapanış fiyatlarından hesaplanmıştır. Geçmiş performans gelecekteki sonuçların göstergesi değildir; yatırım tavsiyesi değildir.
      </p>
    </section>
  );
}
