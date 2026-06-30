// /arama?q=... — server component. Statik + dinamik sonuclari gosterir.

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
    title: query + ' \u2014 Arama Sonuçları',
    description:
      'Finans\u00c7özum\u0027de \u0022' + query + '\u0022 aramasının sonuçları \u2014 araçlar, endeksler, döviz, altın, hisse ve blog yazıları.',
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

interface StocksApiItem {
  symbol: string;
  name: string;
  sector?: string;
}

async function fetchDynamic(q: string): Promise<{ blog: BlogResult[]; stocks: StockResult[] }> {
  const limit: number = 10;
  const base: string = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

  const headers: HeadersInit = {};

  const results = await Promise.allSettled([
    fetch(
      base + '/api/blogs?limit=' + limit + '&search=' + encodeURIComponent(q),
      { next: { revalidate: 60 }, headers },
    ),
    fetch(
      base + '/api/tools/stocks?search=' + encodeURIComponent(q),
      { next: { revalidate: 300 }, headers },
    ),
  ]);

  const blog: BlogResult[] = [];
  const stocks: StockResult[] = [];

  const blogRes = results[0];
  if (blogRes.status === 'fulfilled' && blogRes.value.ok) {
    try {
      const data: unknown = await blogRes.value.json();
      const arr: unknown[] = Array.isArray(data) ? data : (data && typeof data === 'object' && 'data' in data && Array.isArray((data as { data: unknown[] }).data) ? (data as { data: unknown[] }).data : []);
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

  const stocksRes = results[1];
  if (stocksRes.status === 'fulfilled' && stocksRes.value.ok) {
    try {
      const data: unknown = await stocksRes.value.json();
      const arr: unknown[] = Array.isArray(data) ? data : (data && typeof data === 'object' && 'data' in data && Array.isArray((data as { data: unknown[] }).data) ? (data as { data: unknown[] }).data : []);
      for (const s of arr) {
        if (!s || typeof s !== 'object') continue;
        const item = s as StocksApiItem;
        stocks.push({
          href: '/borsa/hisseler/' + item.symbol,
          type: 'Hisse (API)',
          title: item.name + ' (' + item.symbol + ')',
          desc: item.sector ?? 'Borsa \u0130stanbul hissesi',
        });
      }
    } catch { /* noop */ }
    if (stocks.length > limit) stocks.length = limit;
  }

  return { blog, stocks };
}

const TYPE_LABEL: Record<SearchItem['type'], string> = {
  arac: 'Araç',
  endeks: 'Endeks',
  doviz: 'Döviz',
  altin: 'Altın',
  hisse: 'Hisse',
};

export default async function AramaPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const query: string = (q ?? '').trim();

  const staticResults: SearchItem[] = query
    ? searchStatic(query, 30)
    : STATIC_SEARCH_INDEX.slice(0, 30);
  const dynamic: { blog: BlogResult[]; stocks: StockResult[] } = query
    ? await fetchDynamic(query)
    : { blog: [], stocks: [] };

  const totalResults: number =
    staticResults.length + dynamic.blog.length + dynamic.stocks.length;

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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8 pb-20 md:pb-8">
        <Breadcrumb
          items={[
            { label: 'Ana sayfa', href: '/' },
            { label: 'Arama' },
          ]}
        />

        <header className="mb-6">
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
            {query
              ? '\u0022' + query + '\u0022 için arama sonuçları'
              : 'Site içi arama'}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {query
              ? 'Toplam ' + totalResults + ' sonuç \u2014 araçlar, endeksler, döviz, altın, hisseler ve blog yazıları arasında aranır.'
              : 'Finans\u00c7özum içinde en az 2 harf girerek arama yapabilirsiniz.'}
          </p>
        </header>

        <form action="/arama" method="GET" className="mb-8 flex gap-2">
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Araç, döviz, altın, hisse, blog\u2026"
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
            {'\u0022' + query + '\u0022 için sonuç bulunamadı. Farklı anahtar kelime deneyin.'}
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

              {staticResults.length > 0 && (
                <section>
                  <h2 className="mb-3 text-base font-semibold text-foreground">
                    Site \u0130çi Sonuçlar <span className="text-sm text-muted-foreground">({staticResults.length})</span>
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
