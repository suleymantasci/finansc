'use client';

import { useEffect, useState } from 'react';
import NumberFlow from '@number-flow/react';
import { useShallow } from 'zustand/react/shallow';
import { useMarketStore } from '@/stores/market.store';
import { selectQuote, quoteDecimals, type QuoteSpec } from '@/lib/quote';
import { pctTr } from '@/lib/formatters';
import { cn } from '@/lib/utils';

function fmtTime(t?: string) {
  if (!t) return null;
  if (/^\d{1,2}:\d{2}/.test(t)) return t.slice(0, 5);
  const d = new Date(t);
  return Number.isNaN(d.getTime()) ? null : d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Istanbul' });
}

const nf = (v: number, d: number) => v.toLocaleString('tr-TR', { minimumFractionDigits: d, maximumFractionDigits: d });

export function LiveQuote({ spec, label }: { spec: QuoteSpec; label: string }) {
  // useShallow: selectQuote her çağrıda yeni nesne döndürür; sığ karşılaştırma döngüyü önler
  const quote = useMarketStore(useShallow((s) => selectQuote(s, spec)));
  const [waited, setWaited] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setWaited(true), 10000);
    return () => clearTimeout(t);
  }, []);

  const d = quoteDecimals(spec);
  const prefix = quote?.currency === 'USD' ? '$' : '';
  const suffix = quote?.currency === 'TRY' && spec.kind !== 'index' ? ' ₺' : '';
  const ch = quote?.changePct ?? 0;

  if (!quote) {
    return (
      <div className="py-2" aria-busy={!waited}>
        {waited ? (
          <p className="text-sm text-muted-foreground">
            {label} için şu anda canlı fiyat alınamıyor. Piyasa kapalı olabilir; grafik son kapanış verilerini gösterir.
          </p>
        ) : (
          <>
            <div className="skeleton-shimmer h-14 w-72 rounded-lg" />
            <div className="skeleton-shimmer mt-4 h-4 w-96 max-w-full rounded" />
          </>
        )}
      </div>
    );
  }

  const stats: { label: string; value: string }[] = [];
  if (quote.buy != null && spec.kind !== 'stock') stats.push({ label: 'Alış', value: nf(quote.buy, d) });
  if (quote.sell != null && spec.kind !== 'stock') stats.push({ label: 'Satış', value: nf(quote.sell, d) });
  if (quote.low) stats.push({ label: 'Gün düşük', value: nf(quote.low, d) });
  if (quote.high) stats.push({ label: 'Gün yüksek', value: nf(quote.high, d) });
  if (quote.turnover) stats.push({ label: 'İşlem hacmi', value: new Intl.NumberFormat('tr-TR', { notation: 'compact', maximumFractionDigits: 1 }).format(quote.turnover) + ' ₺' });

  return (
    <div>
      <div className="flex flex-wrap items-end gap-x-5 gap-y-2">
        <p className="num text-5xl font-medium leading-none tracking-tight text-foreground sm:text-6xl" aria-live="polite" aria-atomic="true">
          <span className="sr-only">{label} güncel fiyatı: </span>
          <NumberFlow value={quote.price} locales="tr-TR" format={{ minimumFractionDigits: d, maximumFractionDigits: d }} prefix={prefix} suffix={suffix} />
        </p>
        <p className={cn('num flex items-center gap-1.5 pb-1 text-lg font-medium', ch > 0 && 'text-up', ch < 0 && 'text-down', ch === 0 && 'text-neutral')}>
          <span aria-hidden="true">{ch > 0 ? '▲' : ch < 0 ? '▼' : '•'}</span>
          {pctTr(ch, { signed: true })}
          <span className="text-[12px] font-normal text-muted-foreground">günlük</span>
        </p>
      </div>
      {stats.length > 0 && (
        <dl className="mt-5 flex flex-wrap gap-x-8 gap-y-3">
          {stats.map((s) => (
            <div key={s.label}>
              <dt className="text-[12px] text-muted-foreground">{s.label}</dt>
              <dd className="num mt-0.5 text-[15px] text-foreground">{s.value}</dd>
            </div>
          ))}
        </dl>
      )}
      <p className="mt-4 text-[12px] text-muted-foreground">
        {quote.source}
        {fmtTime(quote.time) && <> · Son güncelleme {fmtTime(quote.time)}</>}
      </p>
    </div>
  );
}
