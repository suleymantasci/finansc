'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { SectionIntro } from '@/components/shared/SectionIntro';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { AdBanner } from '@/components/ads/AdBanner';
import { AdInFeed } from '@/components/ads/AdInFeed';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { BlogPost, PaginatedResponse } from '@/types';

export function BlogListClient() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [category, setCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '8', status: 'published' });
    if (category) params.set('category', category);

    api.get<PaginatedResponse<BlogPost>>(`/api/blogs?${params}`)
      .then((res) => {
        setPosts(res.data);
        setTotalPages(res.totalPages);
        // Extract unique categories
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
            onClick={() => { setCategory(null); setPage(1); }}
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
              onClick={() => { setCategory(cat); setPage(1); }}
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
                {featured.thumbnailUrl && (
                  <div className="aspect-video w-full overflow-hidden bg-muted md:w-1/2">
                    <img src={featured.thumbnailUrl} alt={featured.title} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                  </div>
                )}
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
          <div className="grid gap-4 sm:grid-cols-2">
            {rest.map((post, i) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                {/* AdInFeed at position 3 */}
                {i === 2 && <AdInFeed page="blog" className="mb-4" />}
                <Link
                  href={`/blog/${post.slug}`}
                  className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-primary/30"
                >
                  {post.thumbnailUrl && (
                    <div className="aspect-video w-full overflow-hidden bg-muted">
                      <img src={post.thumbnailUrl} alt={post.title} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                    </div>
                  )}
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
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                Önceki
              </Button>
              <span className="text-sm text-muted-foreground">{page} / {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                Sonraki
              </Button>
            </div>
          )}
        </>
      )}

      <AdBanner page="blog" position="bottom" />
    </div>
  );
}
