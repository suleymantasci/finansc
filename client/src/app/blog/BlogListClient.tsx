'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Calendar, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Newspaper, TrendingUp, Landmark, Coins, PiggyBank, CreditCard, BarChart3, Wallet } from 'lucide-react';
import { motion } from 'framer-motion';
import { SectionIntro } from '@/components/shared/SectionIntro';
import { Badge } from '@/components/ui/Badge';
import { AdBanner } from '@/components/ads/AdBanner';
import { AdInFeed } from '@/components/ads/AdInFeed';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { BlogPost, PaginatedResponse } from '@/types';

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

function BlogPlaceholder({ category, title }: { category?: string | null; title: string }) {
  const Icon = (category && CATEGORY_ICONS[category]) || Newspaper;
  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-muted/50">
      <Icon className="h-12 w-12 text-muted-foreground/30" aria-hidden />
    </div>
  );
}

export function BlogListClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [categories, setCategories] = useState<string[]>([]);

  const page = Number(searchParams.get('sayfa')) || 1;
  const category = searchParams.get('kategori') || null;

  const navigate = useCallback((newPage: number, newCategory: string | null) => {
    const params = new URLSearchParams();
    if (newPage > 1) params.set('sayfa', String(newPage));
    if (newCategory) params.set('kategori', newCategory);
    const qs = params.toString();
    router.push(`/blog${qs ? `?${qs}` : ''}`, { scroll: false });
  }, [router]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '10', status: 'published' });
    if (category) params.set('category', category);

    api.get<PaginatedResponse<BlogPost>>(`/api/blogs?${params}`)
      .then((res) => {
        setPosts(res.data);
        setTotalPages(res.totalPages);
        const cats = [...new Set(res.data.map((p) => p.category).filter(Boolean))] as string[];
        if (cats.length > categories.length) setCategories(cats);
      })
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, [page, category]);

  const featured = posts.find((p) => p.isFeatured) || posts[0];
  const rest = posts.filter((p) => p.id !== featured?.id);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8 pb-20 md:pb-8">
      <SectionIntro
        title="Bilgi Merkezi"
        description="Piyasa analizleri, finansal rehberler ve güncel yorumlar"
      />

      {/* Category Filter */}
      {categories.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => navigate(1, null)}
            className={cn(
              'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
              !category
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-surface-hover',
            )}
          >
            Tümü
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => navigate(1, cat)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                category === cat
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-surface-hover',
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : posts.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">Henüz yazı bulunmuyor.</p>
      ) : (
        <>
          {/* Featured post */}
          {featured && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <Link
                href={`/blog/${featured.slug}`}
                className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card md:flex-row"
              >
                <div className="aspect-video w-full overflow-hidden bg-muted md:w-1/2">
                  {featured.thumbnailUrl ? (
                    <img src={featured.thumbnailUrl} alt={featured.title} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                  ) : (
                    <BlogPlaceholder category={featured.category} title={featured.title} />
                  )}
                </div>
                <div className="flex flex-1 flex-col justify-center p-5 lg:p-8">
                  {featured.category && <Badge variant="default" className="mb-2 self-start">{featured.category}</Badge>}
                  <h2 className="text-xl font-bold lg:text-2xl">{featured.title}</h2>
                  {featured.excerpt && <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{featured.excerpt}</p>}
                  <div className="mt-4 flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {featured.publishedAt ? new Date(featured.publishedAt).toLocaleDateString('tr-TR') : new Date(featured.createdAt).toLocaleDateString('tr-TR')}
                  </div>
                </div>
              </Link>
            </motion.div>
          )}

          {/* Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((post, i) => {
              const card = (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="h-full"
                >
                  <Link
                  href={`/blog/${post.slug}`}
                  className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-primary/30"
                >
                  <div className="aspect-video w-full overflow-hidden bg-muted">
                    {post.thumbnailUrl ? (
                      <img src={post.thumbnailUrl} alt={post.title} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                    ) : (
                      <BlogPlaceholder category={post.category} title={post.title} />
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    {post.category && <Badge variant="outline" className="mb-2 self-start">{post.category}</Badge>}
                    <h3 className="text-sm font-semibold line-clamp-2 lg:text-base">{post.title}</h3>
                    {post.excerpt && <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{post.excerpt}</p>}
                    <div className="mt-auto flex items-center gap-1 pt-3 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('tr-TR') : new Date(post.createdAt).toLocaleDateString('tr-TR')}
                    </div>
                  </div>
                </Link>
              </motion.div>
              );

              // Insert ad as a separate grid item after position 2
              if (i === 2) {
                return (
                  <>
                    {card}
                    <AdInFeed key="ad-infeed" page="blog" />
                  </>
                );
              }

              return card;
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <nav className="mt-8 flex items-center justify-center gap-1">
              {/* First */}
              <button
                disabled={page <= 1}
                onClick={() => navigate(1, category)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-surface-hover disabled:opacity-30 disabled:pointer-events-none"
                aria-label="İlk sayfa"
              >
                <ChevronsLeft className="h-4 w-4" />
              </button>
              {/* Prev */}
              <button
                disabled={page <= 1}
                onClick={() => navigate(page - 1, category)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-surface-hover disabled:opacity-30 disabled:pointer-events-none"
                aria-label="Önceki sayfa"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              {/* Page numbers */}
              {getPageNumbers(page, totalPages).map((p, idx) =>
                p === '...' ? (
                  <span key={`dots-${idx}`} className="flex h-8 w-8 items-center justify-center text-xs text-muted-foreground">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => navigate(p as number, category)}
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-lg text-xs font-medium transition-colors',
                      p === page
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-surface-hover',
                    )}
                  >
                    {p}
                  </button>
                ),
              )}

              {/* Next */}
              <button
                disabled={page >= totalPages}
                onClick={() => navigate(page + 1, category)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-surface-hover disabled:opacity-30 disabled:pointer-events-none"
                aria-label="Sonraki sayfa"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              {/* Last */}
              <button
                disabled={page >= totalPages}
                onClick={() => navigate(totalPages, category)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-surface-hover disabled:opacity-30 disabled:pointer-events-none"
                aria-label="Son sayfa"
              >
                <ChevronsRight className="h-4 w-4" />
              </button>
            </nav>
          )}
        </>
      )}

      <AdBanner page="blog" position="bottom" />
    </div>
  );
}

/** Generate page number array with ellipsis for large page counts */
function getPageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | '...')[] = [1];

  if (current > 3) pages.push('...');

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) pages.push(i);

  if (current < total - 2) pages.push('...');

  pages.push(total);
  return pages;
}
