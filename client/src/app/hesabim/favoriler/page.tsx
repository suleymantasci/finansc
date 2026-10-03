'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Star, Trash2 } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useFavoriteStore } from '@/stores/favorite.store';
import { useMarketStore } from '@/stores/market.store';
import { selectQuote, quoteDecimals, type QuoteSpec } from '@/lib/quote';
import { pctTr } from '@/lib/formatters';
import { GOLD_META } from '@/lib/seo-data/gold';
import { CURRENCY_BY_CODE } from '@/lib/instruments/currencies';
import { COMMODITY_BY_SLUG } from '@/lib/instruments/commodities';
import { INDEX_META } from '@/lib/seo-data/indices';
import { STOCK_META } from '@/lib/seo-data/stocks';
import { TOOL_META } from '@/lib/seo-data/tools';
import { cn } from '@/lib/utils';
import { BORSA_ENABLED } from '@/lib/features';
import type { Favorite, FavoriteType } from '@/types';

const ALL_GROUPS: { type: FavoriteType; title: string }[] = [
  { type: 'gold', title: 'Altın' },
  { type: 'currency', title: 'Döviz' },
  { type: 'stock', title: 'Hisseler' },
  { type: 'index', title: 'Endeksler' },
  { type: 'commodity', title: 'Emtia' },
  { type: 'tool', title: 'Hesaplama araçları' },
];
const GROUPS = BORSA_ENABLED ? ALL_GROUPS : ALL_GROUPS.filter((g) => g.type !== 'stock' && g.type !== 'index');

/** Favori kaydını görünen ad, bağlantı ve (varsa) canlı fiyat tanımına çevir */
function describe(f: Favorite): { label: string; sub?: string; href: string; spec?: QuoteSpec } {
  switch (f.type) {
    case 'gold':
      return { label: GOLD_META[f.symbol]?.name ?? f.symbol, href: `/altin/${f.symbol}`, spec: { kind: 'gold', slug: f.symbol } };
    case 'currency': {
      const c = CURRENCY_BY_CODE[f.symbol];
      return { label: c?.name ?? f.symbol, sub: `${f.symbol}/TRY`, href: c ? `/doviz/${c.slug}` : '/doviz', spec: { kind: 'fx', code: f.symbol } };
    }
    case 'stock':
      return { label: f.symbol, sub: STOCK_META[f.symbol]?.name, href: `/borsa/hisseler/${f.symbol}`, spec: { kind: 'stock', symbol: f.symbol } };
    case 'index':
      return { label: INDEX_META[f.symbol]?.name ?? f.symbol, sub: f.symbol, href: `/borsa/endeksler/${f.symbol}`, spec: { kind: 'index', symbol: f.symbol } };
    case 'commodity': {
      const c = COMMODITY_BY_SLUG[f.symbol];
      return { label: c?.name ?? f.symbol, sub: c?.unit, href: `/emtia/${f.symbol}` };
    }
    case 'tool':
      return { label: TOOL_META[f.symbol]?.title.split('|')[0].trim() ?? f.symbol, href: `/araclar/${f.symbol}` };
  }
}

function Row({ fav, onRemove }: { fav: Favorite; onRemove: (id: string) => void }) {
  const d = describe(fav);
  const q = useMarketStore(useShallow((s) => (d.spec ? selectQuote(s, d.spec) : null)));
  const ch = q?.changePct ?? null;
  return (
    <li className="flex items-center gap-3 px-5 py-3">
      <Link href={d.href} className="group min-w-0 flex-1">
        <span className="block truncate text-[15px] font-medium text-foreground group-hover:text-primary">{d.label}</span>
        {d.sub && <span className="block truncate text-[12px] text-muted-foreground">{d.sub}</span>}
      </Link>
      {d.spec && (
        <span className="text-right">
          <span className="num block text-sm text-foreground">
            {q ? q.price.toLocaleString('tr-TR', { minimumFractionDigits: quoteDecimals(d.spec), maximumFractionDigits: quoteDecimals(d.spec) }) : '—'}
          </span>
          {ch != null && <span className={cn('num block text-[12px]', ch > 0 && 'text-up', ch < 0 && 'text-down', ch === 0 && 'text-neutral')}>{pctTr(ch, { signed: true })}</span>}
        </span>
      )}
      <button
        type="button"
        onClick={() => onRemove(fav.id)}
        aria-label={`${d.label} favorilerden çıkar`}
        className="grid size-9 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-down/10 hover:text-down"
      >
        <Trash2 className="h-4 w-4" aria-hidden="true" />
      </button>
    </li>
  );
}

export default function FavorilerPage() {
  const { favorites, loading, loaded, fetchFavorites, removeFavorite } = useFavoriteStore();

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const groups = GROUPS.map((g) => ({ ...g, items: favorites.filter((f) => f.type === g.type) })).filter((g) => g.items.length > 0);

  return (
    <div>
      <p className="eyebrow text-primary">Hesabım</p>
      <h1 className="font-display mt-2 text-4xl text-foreground sm:text-5xl">Favorilerim</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Detay sayfalarındaki <Star className="inline h-3.5 w-3.5 align-[-2px]" aria-hidden="true" /> Favorilere ekle butonuyla altın, döviz, {BORSA_ENABLED && 'hisse, endeks, '}emtia ve hesaplama araçlarını buraya ekleyebilirsiniz.
      </p>

      <div className="mt-8 space-y-6">
        {!loaded && loading ? (
          <div className="skeleton-shimmer h-40 rounded-2xl" aria-busy="true" />
        ) : groups.length === 0 ? (
          <div className="atlas-card p-8 text-center">
            <p className="font-display text-2xl text-foreground">Henüz favoriniz yok</p>
            <p className="mt-2 text-sm text-muted-foreground">Başlamak için en çok takip edilen sayfalardan birine göz atın.</p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {[
                ['Gram altın', '/altin/gram-altin'],
                ['Dolar', '/doviz/dolar'],
                ['BIST 100', '/borsa/endeksler/XU100'],
                ['Kredi hesaplama', '/araclar/ihtiyac-kredisi'],
              ].filter(([, h]) => BORSA_ENABLED || !h.startsWith('/borsa')).map(([l, h]) => (
                <Link key={h} href={h} className="inline-flex h-9 items-center rounded-full border border-border px-4 text-[13px] text-muted-foreground hover:border-primary/60 hover:text-foreground">
                  {l}
                </Link>
              ))}
            </div>
          </div>
        ) : (
          groups.map((g) => (
            <section key={g.type} aria-labelledby={`fav-${g.type}`} className="atlas-card overflow-hidden">
              <h2 id={`fav-${g.type}`} className="flex items-baseline justify-between px-5 pt-5 font-display text-2xl text-foreground">
                {g.title}
                <span className="num font-sans text-[12px] text-muted-foreground">{g.items.length}</span>
              </h2>
              <ul className="mt-2 divide-y divide-border/60 pb-2">
                {g.items.map((f) => (
                  <Row key={f.id} fav={f} onRemove={removeFavorite} />
                ))}
              </ul>
            </section>
          ))
        )}
      </div>
    </div>
  );
}
