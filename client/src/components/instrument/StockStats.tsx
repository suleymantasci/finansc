import Link from 'next/link';
import { cn } from '@/lib/utils';
import { fmtDate, fmtNum, fmtPct, fmtTl, type StockStats as Stats } from '@/lib/stock-stats';

const tone = (v: number | null) => (v == null ? 'text-muted-foreground' : v > 0 ? 'text-up' : v < 0 ? 'text-down' : 'text-neutral');

/** Hisse performans özeti — sunucuda çizilir (yapay zekâ tarayıcıları ve Google için sayısal içerik). */
export function StockStats({ s }: { s: Stats }) {
  const rows = s.periods.filter((p) => p.stock != null);
  return (
    <section aria-labelledby="stock-stats" className="atlas-card overflow-clip">
      <div className="flex flex-wrap items-baseline justify-between gap-2 px-5 pt-5 sm:px-6">
        <h2 id="stock-stats" className="font-display text-2xl text-foreground">
          {s.symbol} performans özeti
        </h2>
        <span className="text-[12px] text-muted-foreground">{fmtDate(s.asOf)} kapanışına göre</span>
      </div>

      {rows.length > 0 && (
        <table className="mt-3 w-full text-sm">
          <caption className="sr-only">{s.symbol} ve BIST 100 dönemsel getirileri</caption>
          <thead>
            <tr className="border-b border-border text-[12px] text-muted-foreground">
              <th scope="col" className="px-4 py-2.5 text-left font-normal sm:px-6">Dönem</th>
              <th scope="col" className="px-2 py-2.5 text-right font-normal sm:px-3">{s.symbol}</th>
              <th scope="col" className="px-2 py-2.5 text-right font-normal sm:px-3">BIST 100</th>
              <th scope="col" className="px-4 py-2.5 text-right font-normal sm:px-6">Fark</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => {
              const diff = p.stock != null && p.index != null ? p.stock - p.index : null;
              return (
                <tr key={p.key} className="border-b border-border/60 last:border-0">
                  <th scope="row" className="px-4 py-2.5 text-left font-normal text-foreground sm:px-6">{p.label}</th>
                  <td className={cn('num px-2 py-2.5 text-right font-medium sm:px-3', tone(p.stock))}>{fmtPct(p.stock)}</td>
                  <td className={cn('num px-2 py-2.5 text-right sm:px-3', tone(p.index))}>{fmtPct(p.index)}</td>
                  <td className={cn('num px-4 py-2.5 text-right sm:px-6', tone(diff))}>
                    {diff == null ? '—' : `${diff > 0 ? '+' : diff < 0 ? '−' : ''}${fmtNum(Math.abs(diff), 1)} puan`}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      <div className="grid gap-px border-t border-border bg-border sm:grid-cols-2">
        <div className="bg-card px-5 py-4 sm:px-6">
          <p className="text-[12px] text-muted-foreground">52 haftalık aralık</p>
          <p className="num mt-1 text-[15px] text-foreground">
            {fmtNum(s.low52.value)} – {fmtNum(s.high52.value)} TL
          </p>
          <div className="relative mt-3 h-1.5 rounded-full bg-muted" aria-hidden="true">
            <span
              className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-card bg-primary"
              style={{ left: `${Math.min(100, Math.max(0, s.rangePos))}%` }}
            />
          </div>
          <p className="mt-2 text-[12px] text-muted-foreground">
            Son kapanış {fmtNum(s.last)} TL · aralığın %{Math.round(s.rangePos)} seviyesi
          </p>
        </div>
        <div className="bg-card px-5 py-4 sm:px-6">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-[13px]">
            {s.avgTurnover20 != null && (
              <div>
                <dt className="text-[12px] text-muted-foreground">Ort. günlük hacim (20 gün)</dt>
                <dd className="num mt-0.5 text-foreground">{fmtTl(s.avgTurnover20)}</dd>
              </div>
            )}
            {s.volatility != null && (
              <div>
                <dt className="text-[12px] text-muted-foreground">Yıllık oynaklık</dt>
                <dd className="num mt-0.5 text-foreground">%{fmtNum(s.volatility, 1)}</dd>
              </div>
            )}
            {s.maxDrawdown && (
              <div className="col-span-2">
                <dt className="text-[12px] text-muted-foreground">Dönemdeki en büyük düşüş</dt>
                <dd className="num mt-0.5 text-foreground">
                  {fmtPct(s.maxDrawdown.pct)}{' '}
                  <span className="text-[12px] text-muted-foreground">
                    ({fmtDate(s.maxDrawdown.from)} → {fmtDate(s.maxDrawdown.to)})
                  </span>
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-border px-5 py-4 text-[13px] sm:px-6">
        <span className="text-muted-foreground">Endeks üyeliği:</span>
        {s.indices.length ? (
          s.indices.map((i) => (
            <Link
              key={i}
              href={`/borsa/endeksler/XU${i.slice(4).padStart(3, '0')}`}
              className="rounded-full border border-border px-2.5 py-0.5 text-foreground transition-colors hover:border-primary/60 hover:text-primary"
            >
              BIST {i.slice(4)}
            </Link>
          ))
        ) : (
          <span className="text-foreground">BIST 30/50/100 dışında</span>
        )}
      </div>
      <p className="border-t border-border px-5 py-3 text-[11px] text-muted-foreground sm:px-6">
        Günlük kapanış fiyatlarından hesaplanmıştır ({s.days} işlem günü). Geçmiş performans gelecekteki sonuçların göstergesi değildir; yatırım tavsiyesi değildir.
      </p>
    </section>
  );
}
