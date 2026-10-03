// /arama?q=... — server component. Statik + dinamik sonuclari gosterir.

import { API_URL } from '@/lib/constants';
import { safeJsonLd } from '@/lib/json-ld';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import {
  STATIC_SEARCH_INDEX,
  searchStatic,
  type SearchItem,
} from '@/lib/search/static-index';
import { SITE_NAME, SITE_URL } from '@/lib/constants';
import { Breadcrumb } from '@/components/shared/Breadcrumb';
import { SearchResultItem } from '@/components/shared/SearchInput';
import { BORSA_ENABLED } from '@/lib/features';

interface Props {
  searchParams: Promise<{ q?: string }>;
}

interface BlogResult {
  href: string;
  type: string;
  title: string;
  desc: string;
}

interface StockResult extends BlogResult {}
interface IndexResult extends BlogResult {}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q } = await searchParams;
  const query: string = q?.trim() ?? '';
  if (!query) {
    return {
      title: 'Arama',
      robots: { index: false, follow: true },
      alternates: { canonical: SITE_URL + '/arama' },
    };
  }
  return {
    title: query + ' — Arama Sonuçları',
    description:
      'FinansÇözüm\'de "' + query + '" aramasının sonuçları — ' + (BORSA_ENABLED ? 'araçlar, endeksler, döviz, altın, hisse ve blog yazıları.' : 'araçlar, döviz, altın, emtia ve blog yazıları.'),
    robots: { index: false, follow: true },
    alternates: { canonical: SITE_URL + '/arama?q=' + encodeURIComponent(query) },
  };
}

interface BlogApiItem {
  slug: string;
  title: string;
  description?: string;
  excerpt?: string;
}

interface MarketApiItem {
  symbol: string;
  name: string;
  sector?: string;
}

async function fetchDynamic(q: string): Promise<{
  blog: BlogResult[];
  stocks: StockResult[];
  indices: IndexResult[];
}> {
  const limit: number = 15;
  const base: string = API_URL;

  const results = await Promise.allSettled([
    fetch(
      base + '/api/blogs?limit=' + limit + '&search=' + encodeURIComponent(q),
      { next: { revalidate: 60 } },
    ),
    // Borsa kapalıyken hisse/endeks araması yapılmaz (reddedilen sonuç atlanır)
    BORSA_ENABLED
      ? fetch(base + '/api/market/stocks/search?q=' + encodeURIComponent(q), { next: { revalidate: 300 } })
      : Promise.reject(new Error('borsa disabled')),
    BORSA_ENABLED
      ? fetch(base + '/api/market/indices/search?q=' + encodeURIComponent(q), { next: { revalidate: 300 } })
      : Promise.reject(new Error('borsa disabled')),
  ]);

  const blog: BlogResult[] = [];
  const stocks: StockResult[] = [];
  const indices: IndexResult[] = [];

  // Blog
  const blogRes = results[0];
  if (blogRes.status === 'fulfilled' && blogRes.value.ok) {
    try {
      const data: unknown = await blogRes.value.json();
      const arr: unknown[] = Array.isArray(data) ? data : data && typeof data === 'object' && 'data' in data && Array.isArray((data as { data: unknown[] }).data) ? (data as { data: unknown[] }).data : [];
      for (const p of arr) {
        if (!p || typeof p !== 'object') continue;
        const item = p as BlogApiItem;
        blog.push({
          href: '/blog/' + item.slug,
          type: 'Blog',
          title: item.title,
          desc: item.description ?? item.excerpt ?? '',
        });
      }
    } catch { /* noop */ }
    if (blog.length > limit) blog.length = limit;
  }

  // Stocks (backend proxy)
  const stocksRes = results[1];
  if (stocksRes.status === 'fulfilled' && stocksRes.value.ok) {
    try {
      const data: unknown = await stocksRes.value.json();
      const arr: unknown[] = data && typeof data === 'object' && 'data' in data && Array.isArray((data as { data: unknown[] }).data) ? (data as { data: unknown[] }).data : [];
      for (const s of arr) {
        if (!s || typeof s !== 'object') continue;
        const item = s as MarketApiItem;
        stocks.push({
          href: '/borsa/hisseler/' + item.symbol.toUpperCase(),
          type: 'Hisse',
          title: item.name + ' (' + item.symbol.toUpperCase() + ')',
          desc: 'Borsa İstanbul hissesi',
        });
      }
    } catch { /* noop */ }
    if (stocks.length > limit) stocks.length = limit;
  }

  // Indices (backend proxy)
  const indicesRes = results[2];
  if (indicesRes.status === 'fulfilled' && indicesRes.value.ok) {
    try {
      const data: unknown = await indicesRes.value.json();
      const arr: unknown[] = data && typeof data === 'object' && 'data' in data && Array.isArray((data as { data: unknown[] }).data) ? (data as { data: unknown[] }).data : [];
      for (const i of arr) {
        if (!i || typeof i !== 'object') continue;
        const item = i as MarketApiItem;
        indices.push({
          href: '/borsa/endeksler/' + item.symbol.toUpperCase(),
          type: 'Endeks',
          title: item.symbol.toUpperCase(),
          desc: item.name + ' endeksi',
        });
      }
    } catch { /* noop */ }
    if (indices.length > limit) indices.length = limit;
  }

  return { blog, stocks, indices };
}

const TYPE_LABEL: Record<SearchItem['type'], string> = {
  arac: 'Araç',
  endeks: 'Endeks',
  doviz: 'Döviz',
  altin: 'Altın',
  hisse: 'Hisse',
  emtia: 'Emtia',
};

export default async function AramaPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const query: string = (q ?? '').trim();

  const staticResults: SearchItem[] = query
    ? searchStatic(query, 30)
    : STATIC_SEARCH_INDEX.slice(0, 30);
  const dynamic: { blog: BlogResult[]; stocks: StockResult[]; indices: IndexResult[] } = query
    ? await fetchDynamic(query)
    : { blog: [], stocks: [], indices: [] };

  const totalResults: number =
    staticResults.length + dynamic.blog.length + dynamic.stocks.length + dynamic.indices.length;

  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'SearchResultsPage',
    url: SITE_URL + '/arama?q=' + encodeURIComponent(query),
    publisher: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
  };
  if (query) {
    jsonLd.query = query;
    jsonLd.numberOfItems = totalResults;
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
      />

      <div className="mx-auto max-w-[1440px] px-4 py-6 lg:px-8 pb-24 md:pb-12">
        <Breadcrumb
          items={[
            { label: 'Ana sayfa', href: '/' },
            { label: 'Arama' },
          ]}
        />

        <header className="mb-6">
          <h1 className="font-display text-balance text-4xl text-foreground sm:text-5xl">
            {query
              ? '"' + query + '" için arama sonuçları'
              : 'Site içi arama'}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {query
              ? 'Toplam ' + totalResults + ' sonuç — araçlar, endeksler, döviz, altın, hisseler ve blog yazıları arasında aranır.'
              : 'FinansÇözüm içinde en az 2 harf girerek arama yapabilirsiniz.'}
          </p>
        </header>

        <form action="/arama" method="GET" className="mb-8 flex gap-2">
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Araç, döviz, altın, hisse, blog…"
            className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Ara
          </button>
        </form>

        {query.length < 2 ? (
          <p className="text-sm text-muted-foreground">En az 2 karakter girin.</p>
        ) : totalResults === 0 ? (
          <p className="text-sm text-muted-foreground">
            {'"' + query + '" için sonuç bulunamadı. Farklı anahtar kelime deneyin.'}
          </p>
        ) : (
          <Suspense>
            <div className="space-y-8">
              {dynamic.stocks.length > 0 && (
                <section>
                  <h2 className="mb-3 text-base font-semibold text-foreground">
                    Hisse Sonuçları <span className="text-sm text-muted-foreground">({dynamic.stocks.length})</span>
                  </h2>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {dynamic.stocks.map((s: StockResult) => (
                      <SearchResultItem
                        key={s.href}
                        href={s.href}
                        type={s.type}
                        title={s.title}
                        desc={s.desc}
                      />
                    ))}
                  </div>
                </section>
              )}

              {dynamic.indices.length > 0 && (
                <section>
                  <h2 className="mb-3 text-base font-semibold text-foreground">
                    Endeks Sonuçları <span className="text-sm text-muted-foreground">({dynamic.indices.length})</span>
                  </h2>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {dynamic.indices.map((i: IndexResult) => (
                      <SearchResultItem
                        key={i.href}
                        href={i.href}
                        type={i.type}
                        title={i.title}
                        desc={i.desc}
                      />
                    ))}
                  </div>
                </section>
              )}

              {staticResults.length > 0 && (
                <section>
                  <h2 className="mb-3 text-base font-semibold text-foreground">
                    Site İçi Sonuçlar <span className="text-sm text-muted-foreground">({staticResults.length})</span>
                  </h2>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {staticResults.map((item: SearchItem) => (
                      <SearchResultItem
                        key={item.url}
                        href={item.url}
                        type={TYPE_LABEL[item.type]}
                        title={item.title}
                        desc={item.desc}
                      />
                    ))}
                  </div>
                </section>
              )}

              {dynamic.blog.length > 0 && (
                <section>
                  <h2 className="mb-3 text-base font-semibold text-foreground">
                    Blog Yazıları <span className="text-sm text-muted-foreground">({dynamic.blog.length})</span>
                  </h2>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {dynamic.blog.map((b: BlogResult) => (
                      <SearchResultItem
                        key={b.href}
                        href={b.href}
                        type={b.type}
                        title={b.title}
                        desc={b.desc}
                      />
                    ))}
                  </div>
                </section>
              )}
            </div>
          </Suspense>
        )}
      </div>
    </>
  );
}
