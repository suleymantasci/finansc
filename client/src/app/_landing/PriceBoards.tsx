'use client';

import Link from 'next/link';
import { useMarketStore } from '@/stores/market.store';
import { pickGold } from '@/lib/market-pick';
import { cn } from '@/lib/utils';
import { SectionHead } from './parts';

/**
 * Altın & döviz fiyat panoları — "çeyrek altın kaç TL", "sterlin ne kadar"
 * gibi en sık aramalara ana sayfada doğrudan cevap.
 */

const GOLD_ROWS = [
  { type: 'Gram Altın', href: '/altin/gram-altin' },
  { type: 'Çeyrek Altın', href: '/altin/ceyrek-altin' },
  { type: 'Yarım Altın', href: '/altin/yarim-altin' },
  { type: 'Tam Altın', href: '/altin/tam-altin' },
  { type: 'Cumhuriyet Altını', href: '/altin/cumhuriyet-altini' },
  { type: '22 Ayar Bilezik', href: '/altin/bilezik' },
  { type: 'Ons Altın', href: '/altin/ons-altin', usd: true },
];

const FX_ROWS: { name: string; label?: string; code: string; href: string }[] = [
  { name: 'Amerikan Doları', code: 'USD', href: '/doviz/dolar' },
  { name: 'Euro', code: 'EUR', href: '/doviz/euro' },
  { name: 'İngiliz Sterlini', code: 'GBP', href: '/doviz/sterlin' },
  // API adı 'Frankı'; ekranda doğru yazım gösterilir
  { name: 'İsviçre Frankı', label: 'İsviçre Frangı', code: 'CHF', href: '/doviz/frang' },
  { name: 'Japon Yeni', code: 'JPY', href: '/doviz/yen' },
  { name: 'Çin Yuanı', code: 'CNY', href: '/doviz/yuan' },
  { name: 'Rus Rublesi', code: 'RUB', href: '/doviz/ruble' },
];

function fmt(v: number, d: number) {
  return v.toLocaleString('tr-TR', { minimumFractionDigits: d, maximumFractionDigits: d });
}

function Change({ v }: { v: number | null | undefined }) {
  const x = v ?? 0;
  return (
    <span className={cn('num', x > 0 && 'text-up', x < 0 && 'text-down', x === 0 && 'text-neutral')}>
      {x > 0 ? '+' : ''}
      {fmt(x, 2)}%
    </span>
  );
}

function Board({
  id,
  title,
  href,
  hrefLabel,
  loading,
  rows,
}: {
  id: string;
  title: string;
  href: string;
  hrefLabel: string;
  loading: boolean;
  rows: { key: string; label: string; sub?: string; href: string; buy?: number; sell?: number; change?: number | null; d: number; flash?: 'up' | 'down' }[];
}) {
  return (
    <div className="atlas-card p-5 sm:p-6">
      <div className="mb-2 flex items-center justify-between">
        <h3 id={id} className="font-display text-2xl text-foreground">
          {title}
        </h3>
        <Link href={href} className="text-sm text-muted-foreground hover:text-primary">
          {hrefLabel}
        </Link>
      </div>
      <table className="w-full text-sm" aria-labelledby={id}>
        <thead>
          <tr className="border-b border-border text-[11px] text-muted-foreground">
            <th scope="col" className="py-2.5 text-left font-normal">Tür</th>
            <th scope="col" className="py-2.5 text-right font-normal">Alış</th>
            <th scope="col" className="py-2.5 text-right font-normal">Satış</th>
            <th scope="col" className="py-2.5 text-right font-normal">Değişim</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.key}
              className={cn(
                'border-b border-border/60 last:border-0 transition-colors hover:bg-surface-hover',
                r.flash === 'up' && 'flash-up',
                r.flash === 'down' && 'flash-down',
              )}
            >
              <th scope="row" className="py-2.5 text-left font-normal">
                <Link href={r.href} className="text-foreground hover:text-primary">
                  {r.label}
                </Link>
                {r.sub && <span className="ml-2 text-[11px] text-muted-foreground">{r.sub}</span>}
              </th>
              <td className="num py-2.5 text-right text-foreground/85">
                {loading || r.buy == null ? <span className="skeleton-shimmer ml-auto block h-3 w-16 rounded" /> : fmt(r.buy, r.d)}
              </td>
              <td className="num py-2.5 text-right text-foreground">
                {loading || r.sell == null ? <span className="skeleton-shimmer ml-auto block h-3 w-16 rounded" /> : fmt(r.sell, r.d)}
              </td>
              <td className="py-2.5 text-right">{r.buy == null ? '' : <Change v={r.change} />}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function PriceBoards() {
  const { goldPrices, goldLoading, serbestCurrencies, currencyLoading, flashMap } = useMarketStore();

  const goldRows = GOLD_ROWS.map((g) => {
    const p = pickGold(goldPrices, g.type);
    return {
      key: g.type,
      label: g.type,
      sub: g.usd ? 'USD' : undefined,
      href: g.href,
      buy: p?.buyPrice,
      sell: p?.sellPrice,
      change: p?.changePercent,
      d: 2,
      flash: p ? flashMap[`${p.source}-${p.goldType}`] : undefined,
    };
  });

  const fxRows = FX_ROWS.map((f) => {
    const c = serbestCurrencies.find((x) => x.name === f.name);
    return {
      key: f.code,
      label: f.label ?? f.name,
      sub: f.code,
      href: f.href,
      buy: c?.buyPrice,
      sell: c?.sellPrice,
      change: c?.changePercent,
      d: 4,
      flash: c ? flashMap[`currency-serbest-piyasa-${c.name}`] : undefined,
    };
  });

  return (
    <section aria-labelledby="boards-title" className="mx-auto max-w-[1440px] px-4 lg:px-8">
      <SectionHead id="boards-title" eyebrow="Serbest piyasa" title="Altın ve döviz, bir bakışta" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Board id="board-gold" title="Altın fiyatları" href="/altin" hrefLabel="Tüm altınlar" loading={goldLoading} rows={goldRows} />
        <Board id="board-fx" title="Döviz kurları" href="/doviz" hrefLabel="Tüm kurlar" loading={currencyLoading} rows={fxRows} />
      </div>
    </section>
  );
}
