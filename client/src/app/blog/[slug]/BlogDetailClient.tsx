'use client';

import Link from 'next/link';
import { Calendar, ArrowLeft, Share2, Calculator, PiggyBank, TrendingUp, ArrowUpRight, ArrowDownRight, Newspaper, Landmark, Coins, CreditCard, BarChart3, Wallet, Clock, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { AdInContent } from '@/components/ads/AdInContent';
import { ReportErrorButton } from '@/components/shared/ReportErrorButton';
import { RelatedTools } from '@/components/blog/RelatedTools';
import { useMarketStore } from '@/stores/market.store';
import { formatDecimal, formatPercent } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import type { BlogPost } from '@/types';

const CATEGORY_ICONS: Record<string, typeof Newspaper> = {
  borsa: TrendingUp,
  hisse: BarChart3,
  altin: Coins,
  doviz: Landmark,
  kredi: CreditCard,
  tasarruf: PiggyBank,
  emeklilik: Wallet,
  yatirim: TrendingUp,
};

function BlogPlaceholder({ category, className }: { category?: string | null; className?: string }) {
  const Icon = (category && CATEGORY_ICONS[category]) || Newspaper;
  return (
    <div className={cn('flex items-center justify-center bg-gradient-to-br from-muted to-muted/50', className)}>
      <Icon className="h-12 w-12 text-muted-foreground/30" aria-hidden />
    </div>
  );
}

const SIDEBAR_TOOLS = [
  { slug: 'ihtiyac-kredisi', title: 'Kredi Hesaplama', desc: 'Taksit ve maliyet hesabı', icon: Calculator },
  { slug: 'vadeli-mevduat', title: 'Vadeli Mevduat', desc: 'Net getiri hesaplama', icon: PiggyBank },
];

interface Props {
  post: BlogPost | null;
  relatedPosts: BlogPost[];
  readingTime?: number;
}

export function BlogDetailClient({ post, relatedPosts, readingTime }: Props) {
  const { indices, goldPrices, flashMap } = useMarketStore();

  if (!post) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Yazı bulunamadı</h1>
        <p className="mt-2 text-muted-foreground">Bu yazı kaldırılmış veya yayından kaldırılmış olabilir.</p>
        <Link href="/blog">
          <Button variant="outline" className="mt-4">← Bilgi Merkezi&apos;ne dön</Button>
        </Link>
      </div>
    );
  }

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: post.title, url: window.location.href });
    } else {
      await navigator.clipboard.writeText(window.location.href);
    }
  };

  const dateStr = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' })
    : new Date(post.createdAt).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' });

  // Mini market data for sidebar
  const topIndices = (indices || []).filter(i => i.symbol && i.symbol !== 'code').slice(0, 3);
  const topGold = (goldPrices || []).filter(g => ['Gram Altın', 'Çeyrek Altın'].includes(g.goldType)).slice(0, 2);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 pb-20 md:pb-8">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">Ana Sayfa</Link>
        <ChevronRight className="h-3 w-3" />
        <Link href="/blog" className="hover:text-foreground">Bilgi Merkezi</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="truncate max-w-[200px] text-foreground">{post.title}</span>
      </nav>

      <div className="flex flex-col gap-8 lg:flex-row">
        {/* ── Main Content ── */}
        <article className="min-w-0 flex-1">
          {/* Hero Image */}
          <div className="mb-6 aspect-video w-full overflow-hidden rounded-xl bg-muted">
            {post.thumbnailUrl ? (
              <img src={post.thumbnailUrl} alt={post.title} className="h-full w-full object-cover" />
            ) : (
              <BlogPlaceholder category={post.category} className="h-full w-full rounded-xl" />
            )}
          </div>

          {/* Meta */}
          <div className="mb-4 flex flex-wrap items-center gap-3">
            {post.category && <Badge variant="default">{post.category}</Badge>}
            <time className="flex items-center gap-1 text-sm text-muted-foreground" dateTime={post.publishedAt || post.createdAt}>
              <Calendar className="h-3.5 w-3.5" /> {dateStr}
            </time>
            {readingTime && (
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="h-3.5 w-3.5" /> {readingTime} dk okuma
              </span>
            )}
            <button onClick={handleShare} className="ml-auto flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
              <Share2 className="h-3.5 w-3.5" /> Paylaş
            </button>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold leading-tight lg:text-3xl">{post.title}</h1>
          {post.excerpt && <p className="mt-3 text-base text-muted-foreground">{post.excerpt}</p>}

          {/* Content */}
          <div
            className="prose prose-slate dark:prose-invert mt-8 max-w-none"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          <AdInContent page="blog-detail" className="my-8" />

          <div className="flex justify-end">
            <ReportErrorButton type="blog" slug={post.slug} pageTitle={post.title} />
          </div>

          {/* Related Tools — category bazlı internal link juice */}
          <RelatedTools category={post.category} slug={post.slug} />

          {/* Related Posts */}
          {relatedPosts.length > 0 && (
            <section className="mt-12 border-t border-border pt-8">
              <h2 className="mb-4 text-lg font-bold">İlgili Yazılar</h2>
              <div className="grid gap-4 sm:grid-cols-3">
                {relatedPosts.map((rp) => (
                  <Link
                    key={rp.id}
                    href={`/blog/${rp.slug}`}
                    className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-primary/30"
                  >
                    <div className="aspect-video w-full overflow-hidden bg-muted">
                      {rp.thumbnailUrl ? (
                        <img src={rp.thumbnailUrl} alt={rp.title} loading="lazy" className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                      ) : (
                        <BlogPlaceholder category={rp.category} />
                      )}
                    </div>
                    <div className="p-3">
                      <h3 className="text-sm font-semibold line-clamp-2">{rp.title}</h3>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </article>

        {/* ── Sidebar ── */}
        <aside className="w-full shrink-0 lg:w-72 xl:w-80">
          <div className="sticky top-20 max-h-[calc(100vh-6rem)] space-y-5 overflow-y-auto">

            {/* Borsa Mini Table */}
            {topIndices.length > 0 && (
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-bold">
                    <TrendingUp className="mr-1.5 inline h-4 w-4 text-primary" />
                    Borsa
                  </h3>
                  <Link href="/borsa" className="text-xs text-primary hover:underline">Detay →</Link>
                </div>
                <div className="space-y-2">
                  {topIndices.map((idx) => (
                    <div key={idx.symbol} className="flex items-center justify-between text-xs">
                      <span className="font-medium text-foreground">{idx.symbol}</span>
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          'font-mono tabular-nums',
                          flashMap[idx.symbol] === 'up' && 'text-flash-up',
                          flashMap[idx.symbol] === 'down' && 'text-flash-down',
                        )}>{formatDecimal(idx.value)}</span>
                        <span className={cn(
                          'flex items-center gap-0.5 font-mono tabular-nums font-semibold',
                          idx.changePercent > 0 && 'text-up',
                          idx.changePercent < 0 && 'text-down',
                          idx.changePercent === 0 && 'text-neutral',
                        )}>
                          {idx.changePercent > 0 ? <ArrowUpRight className="h-3 w-3" /> : idx.changePercent < 0 ? <ArrowDownRight className="h-3 w-3" /> : null}
                          {formatPercent(idx.changePercent)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Altın Mini Table */}
            {topGold.length > 0 && (
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-bold">
                    <span className="mr-1.5 text-yellow-500">●</span>
                    Altın
                  </h3>
                  <Link href="/altin" className="text-xs text-primary hover:underline">Detay →</Link>
                </div>
                <div className="space-y-2">
                  {topGold.map((g) => (
                    <div key={g.goldType} className="flex items-center justify-between text-xs">
                      <span className="font-medium text-foreground">{g.goldType}</span>
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          'font-mono tabular-nums',
                          flashMap[`${g.source}-${g.goldType}`] === 'up' && 'text-flash-up',
                          flashMap[`${g.source}-${g.goldType}`] === 'down' && 'text-flash-down',
                        )}>{formatDecimal(g.buyPrice)}</span>
                        <span className={cn(
                          'flex items-center gap-0.5 font-mono tabular-nums font-semibold',
                          g.changePercent > 0 && 'text-up',
                          g.changePercent < 0 && 'text-down',
                          g.changePercent === 0 && 'text-neutral',
                        )}>
                          {g.changePercent > 0 ? <ArrowUpRight className="h-3 w-3" /> : g.changePercent < 0 ? <ArrowDownRight className="h-3 w-3" /> : null}
                          {formatPercent(g.changePercent)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Hesaplama Araçları */}
            <div className="rounded-xl border border-border bg-card p-4">
              <h3 className="mb-3 text-sm font-bold">
                <Calculator className="mr-1.5 inline h-4 w-4 text-primary" />
                Hesaplama Araçları
              </h3>
              <div className="space-y-1.5">
                {SIDEBAR_TOOLS.map((tool) => {
                  const Icon = tool.icon;
                  return (
                    <Link
                      key={tool.slug}
                      href={`/araclar/${tool.slug}`}
                      className="group flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-surface-hover"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold group-hover:text-primary">{tool.title}</div>
                        <div className="text-[11px] text-muted-foreground">{tool.desc}</div>
                      </div>
                    </Link>
                  );
                })}
              </div>
              <Link
                href="/araclar"
                className="mt-3 block text-center text-xs font-medium text-primary hover:underline"
              >
                Tüm araçlar →
              </Link>
            </div>

            {/* Diğer Yazılar */}
            {relatedPosts.length > 0 && (
              <div className="rounded-xl border border-border bg-card p-4">
                <h3 className="mb-3 text-sm font-bold">Diğer Yazılar</h3>
                <div className="space-y-2.5">
                  {relatedPosts.map((rp) => (
                    <Link
                      key={rp.id}
                      href={`/blog/${rp.slug}`}
                      className="group block"
                    >
                      <h4 className="text-xs font-semibold leading-snug line-clamp-2 group-hover:text-primary">
                        {rp.title}
                      </h4>
                      {rp.excerpt && (
                        <p className="mt-0.5 text-[11px] text-muted-foreground line-clamp-2">{rp.excerpt}</p>
                      )}
                    </Link>
                  ))}
                </div>
                <Link
                  href="/blog"
                  className="mt-3 block text-center text-xs font-medium text-primary hover:underline"
                >
                  Tüm yazılar →
                </Link>
              </div>
            )}

          </div>
        </aside>
      </div>
    </div>
  );
}
