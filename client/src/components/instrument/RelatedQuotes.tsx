'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useMarketStore } from '@/stores/market.store';
import { selectQuote, quoteDecimals, type QuoteSpec } from '@/lib/quote';
import { pctTr } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { ArrowLink } from '@/components/shared/ArrowLink';

export interface RelatedItem {
  label: string;
  sub?: string;
  href: string;
  spec?: QuoteSpec;
  /** Canlı olmayan (emtia) için sabit değer */
  staticPrice?: { value: string; change: number | null };
}

function Row({ item }: { item: RelatedItem }) {
  const q = useMarketStore(useShallow((s) => (item.spec ? selectQuote(s, item.spec) : null)));
  const price = item.staticPrice?.value ?? (q ? q.price.toLocaleString('tr-TR', { minimumFractionDigits: quoteDecimals(item.spec!), maximumFractionDigits: quoteDecimals(item.spec!) }) + (q.currency === 'USD' ? ' $' : item.spec?.kind === 'index' ? '' : ' ₺') : null);
  const ch = item.staticPrice ? item.staticPrice.change : q?.changePct ?? null;
  return (
    <li>
      <Link href={item.href} className="group flex items-center gap-3 px-5 py-3 transition-colors hover:bg-surface-hover sm:px-6">
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] text-foreground group-hover:text-primary">{item.label}</span>
          {item.sub && <span className="block truncate text-[12px] text-muted-foreground">{item.sub}</span>}
        </span>
        <span className="text-right">
          <span className="num block text-sm text-foreground">{price ?? <span className="skeleton-shimmer inline-block h-3 w-16 rounded" />}</span>
          {ch != null && (
            <span className={cn('num block text-[12px]', ch > 0 && 'text-up', ch < 0 && 'text-down', ch === 0 && 'text-neutral')}>{pctTr(ch, { signed: true })}</span>
          )}
        </span>
        <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
      </Link>
    </li>
  );
}

export function RelatedQuotes({ title, items, moreHref, moreLabel }: { title: string; items: RelatedItem[]; moreHref?: string; moreLabel?: string }) {
  if (items.length === 0) return null;
  return (
    <section aria-label={title} className="atlas-card overflow-hidden">
      <div className="flex items-center justify-between px-5 pt-5 sm:px-6">
        <h2 className="font-display text-2xl text-foreground">{title}</h2>
        {moreHref && <ArrowLink href={moreHref} className="text-[13px]">{moreLabel ?? 'Tümü'}</ArrowLink>}
      </div>
      <ul className="mt-2 divide-y divide-border/60 pb-2">
        {items.map((it) => (
          <Row key={it.href} item={it} />
        ))}
      </ul>
    </section>
  );
}
