import Link from 'next/link';
import { Breadcrumb } from '@/components/shared/Breadcrumb';
import { ReportErrorButton } from '@/components/shared/ReportErrorButton';
import { RelatedTools } from '@/components/blog/RelatedTools';
import { RelatedQuotes } from '@/components/instrument/RelatedQuotes';
import { AdInContent } from '@/components/ads/AdInContent';
import { categoryLabel } from '@/lib/blog-categories';
import type { TocItem } from '@/lib/blog-content';
import type { BlogPost } from '@/types';
import { ArticleShare } from './ArticleActions';
import { BORSA_ENABLED } from '@/lib/features';

/**
 * Makale görünümü — sunucuda render edilir (içerik ilk HTML'de).
 * Okuma genişliği ~70 karakter; tablolar kendi kabında yatay kayar.
 */
export function BlogArticle({
  post,
  html,
  toc,
  relatedPosts,
  readingTime,
}: {
  post: BlogPost;
  html: string;
  toc: TocItem[];
  relatedPosts: BlogPost[];
  readingTime: number;
}) {
  const iso = post.publishedAt || post.createdAt;
  const dateStr = new Date(iso).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Europe/Istanbul' });
  const updated = post.updatedAt && post.updatedAt.slice(0, 10) !== iso.slice(0, 10)
    ? new Date(post.updatedAt).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Europe/Istanbul' })
    : null;
  const cat = categoryLabel(post.category);
  const h2s = toc.filter((t) => t.level === 2);

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-6 pb-24 lg:px-8 md:pb-12">
      <Breadcrumb items={[{ label: 'Ana Sayfa', href: '/' }, { label: 'Bilgi Merkezi', href: '/blog' }, { label: post.title }]} />

      <header className="mx-auto max-w-3xl pt-4 text-center">
        {cat && (
          <Link href={`/blog?kategori=${encodeURIComponent(post.category ?? '')}`} className="eyebrow text-primary hover:underline">
            {cat}
          </Link>
        )}
        <h1 className="font-display mt-4 text-balance text-4xl text-foreground sm:text-5xl">{post.title}</h1>
        {post.excerpt && <p className="article-summary mx-auto mt-5 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground">{post.excerpt}</p>}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[13px] text-muted-foreground">
          <span>FinansÇözüm Editör Ekibi</span>
          <span aria-hidden="true">·</span>
          <time dateTime={iso}>{dateStr}</time>
          {updated && (
            <>
              <span aria-hidden="true">·</span>
              <span>
                Güncellendi: <time dateTime={post.updatedAt}>{updated}</time>
              </span>
            </>
          )}
          <span aria-hidden="true">·</span>
          <span>{readingTime} dk okuma</span>
          <ArticleShare title={post.title} />
        </div>
      </header>

      {post.thumbnailUrl && (
        <div className="mx-auto mt-10 max-w-5xl overflow-hidden rounded-2xl border border-border bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={post.thumbnailUrl} alt="" width={1200} height={630} loading="eager" fetchPriority="high" className="aspect-[40/21] w-full object-cover" />
        </div>
      )}

      <div className="mx-auto mt-12 grid max-w-6xl gap-12 lg:grid-cols-[minmax(0,1fr)_300px]">
        <article className="min-w-0">
          {h2s.length >= 3 && (
            <nav aria-label="İçindekiler" className="atlas-card mb-10 p-5 lg:hidden">
              <p className="eyebrow mb-3 text-muted-foreground">İçindekiler</p>
              <ol className="space-y-2 text-[15px]">
                {h2s.map((t) => (
                  <li key={t.id}>
                    <a href={`#${t.id}`} className="text-foreground/85 hover:text-primary">
                      {t.text}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          )}

          <div className="article-prose" dangerouslySetInnerHTML={{ __html: html }} />

          <AdInContent page="blog-detail" className="my-10" />

          <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6 text-[13px] text-muted-foreground">
            <p>Bu içerik bilgilendirme amaçlıdır, yatırım tavsiyesi değildir.</p>
            <ReportErrorButton type="blog" slug={post.slug} pageTitle={post.title} />
          </div>

          <RelatedTools category={post.category ?? undefined} slug={post.slug} />
        </article>

        <aside className="hidden space-y-6 lg:block">
          {h2s.length >= 3 && (
            <nav aria-label="İçindekiler" className="sticky top-32 max-h-[calc(100dvh-10rem)] overflow-y-auto">
              <p className="eyebrow mb-3 text-muted-foreground">İçindekiler</p>
              <ol className="space-y-2.5 border-l border-border text-[14px]">
                {h2s.map((t) => (
                  <li key={t.id} className="-ml-px">
                    <a href={`#${t.id}`} className="block border-l border-transparent pl-4 text-muted-foreground transition-colors hover:border-primary hover:text-foreground">
                      {t.text}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          )}
        </aside>
      </div>

      <div className={relatedPosts.length > 0 ? 'mx-auto mt-16 grid max-w-6xl gap-6 lg:grid-cols-[minmax(0,1fr)_380px]' : 'mx-auto mt-16 max-w-6xl'}>
        {relatedPosts.length > 0 && (
          <section aria-labelledby="related-posts">
            <h2 id="related-posts" className="font-display mb-5 text-3xl text-foreground">
              İlgili yazılar
            </h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {relatedPosts.map((rp) => (
                <Link key={rp.id} href={`/blog/${rp.slug}`} className="atlas-card atlas-card-link group flex flex-col overflow-hidden">
                  <div className="aspect-[40/21] overflow-hidden border-b border-border bg-muted">
                    {rp.thumbnailUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={rp.thumbnailUrl} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]" />
                    )}
                  </div>
                  <p className="font-display p-4 text-lg leading-snug text-foreground group-hover:text-primary">{rp.title}</p>
                </Link>
              ))}
            </div>
          </section>
        )}
        <RelatedQuotes
          title="Piyasalar"
          moreHref="/"
          moreLabel="Ana sayfa"
          layout={relatedPosts.length > 0 ? 'list' : 'grid'}
          items={[
            { label: 'Gram Altın', href: '/altin/gram-altin', spec: { kind: 'gold', slug: 'gram-altin' } },
            { label: 'Dolar', sub: 'USD/TRY', href: '/doviz/dolar', spec: { kind: 'fx', code: 'USD' } },
            { label: 'Euro', sub: 'EUR/TRY', href: '/doviz/euro', spec: { kind: 'fx', code: 'EUR' } },
            ...(BORSA_ENABLED ? [{ label: 'BIST 100', sub: 'XU100', href: '/borsa/endeksler/XU100', spec: { kind: 'index' as const, symbol: 'XU100' } }] : []),
          ]}
        />
      </div>
    </div>
  );
}
