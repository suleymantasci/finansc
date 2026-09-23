'use client';

import { useId, useState } from 'react';
import { ArrowLeftRight } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useMarketStore } from '@/stores/market.store';
import { selectQuote, type QuoteSpec } from '@/lib/quote';

/**
 * Çevirici: birim ↔ para. Fiyat canlı store'dan (spec) ya da sabit değerden (price).
 * Hesap satış fiyatı üzerinden yapılır (kullanıcının ödeyeceği).
 */
export function Converter({
  title,
  unitLabel,
  moneyLabel,
  spec,
  price: fixedPrice,
  decimals = 2,
}: {
  title: string;
  unitLabel: string;
  moneyLabel: string;
  spec?: QuoteSpec;
  price?: number;
  decimals?: number;
}) {
  const id = useId();
  const live = useMarketStore(useShallow((s) => (spec ? selectQuote(s, spec) : null)));
  const price = live?.sell ?? live?.price ?? fixedPrice ?? 0;
  const [amount, setAmount] = useState('1');
  const [reverse, setReverse] = useState(false);

  const n = Number(amount.replace(/\./g, '').replace(',', '.')) || 0;
  const result = price ? (reverse ? n / price : n * price) : 0;
  const fmt = (v: number, d: number) => v.toLocaleString('tr-TR', { minimumFractionDigits: d, maximumFractionDigits: d });

  const from = reverse ? moneyLabel : unitLabel;
  const to = reverse ? unitLabel : moneyLabel;

  return (
    <section aria-labelledby={`${id}-t`} className="atlas-card p-5 sm:p-6">
      <h2 id={`${id}-t`} className="font-display text-2xl text-foreground">
        {title}
      </h2>
      <p className="mt-1 text-[13px] text-muted-foreground">
        {unitLabel} ↔ {moneyLabel} · {spec ? 'satış fiyatı üzerinden' : 'son kapanış fiyatı üzerinden'}
      </p>
      <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-end gap-2">
        <div>
          <label htmlFor={`${id}-a`} className="text-[12px] text-muted-foreground">
            {from}
          </label>
          <input
            id={`${id}-a`}
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9.,]/g, ''))}
            className="num mt-1 h-12 w-full rounded-lg border border-border bg-elevated px-3 text-lg text-foreground focus:border-primary focus:outline-none focus-visible:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <button
          type="button"
          onClick={() => setReverse((r) => !r)}
          aria-label="Çeviri yönünü değiştir"
          className="mb-1 grid size-10 place-items-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary"
        >
          <ArrowLeftRight className="h-4 w-4" aria-hidden="true" />
        </button>
        <div>
          <p className="text-[12px] text-muted-foreground">{to}</p>
          <output
            htmlFor={`${id}-a`}
            aria-live="polite"
            className="num mt-1 flex h-12 w-full items-center rounded-lg border border-border bg-muted/60 px-3 text-lg text-foreground"
          >
            {price ? fmt(result, reverse ? 4 : decimals) : '—'}
          </output>
        </div>
      </div>
    </section>
  );
}
