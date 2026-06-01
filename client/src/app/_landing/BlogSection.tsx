'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Calendar } from 'lucide-react';
import { SectionIntro } from '@/components/shared/SectionIntro';
import { Badge } from '@/components/ui/Badge';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { api } from '@/lib/api';
import type { BlogPost } from '@/types';

export function BlogSection() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ data: BlogPost[] }>('/api/blogs?limit=4&status=published')
      .then((res) => setPosts(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <SectionIntro
        title="Bilgi Merkezi"
        description="Piyasa analizleri ve finansal rehberler"
        ctaLabel="Tüm yazılar"
        ctaHref="/blog"
      />

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <p className="text-sm text-muted-foreground">Henüz yazı bulunmuyor.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {posts.map((post, i) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: i * 0.08 }}
            >
              <Link
                href={`/blog/${post.slug}`}
                className="group flex flex-col rounded-xl border border-border bg-card overflow-hidden transition-colors hover:border-primary/30"
              >
                {post.thumbnailUrl && (
                  <div className="aspect-video w-full overflow-hidden bg-muted">
                    <img
                      src={post.thumbnailUrl}
                      alt={post.title}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  </div>
                )}
                <div className="flex flex-1 flex-col p-4">
                  {post.category && <Badge variant="outline" className="mb-2 self-start">{post.category}</Badge>}
                  <h3 className="text-sm font-semibold line-clamp-2 lg:text-base">{post.title}</h3>
                  {post.excerpt && (
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{post.excerpt}</p>
                  )}
                  <div className="mt-auto flex items-center gap-1 pt-3 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {post.publishedAt
                      ? new Date(post.publishedAt).toLocaleDateString('tr-TR')
                      : new Date(post.createdAt).toLocaleDateString('tr-TR')}
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
