import Link from 'next/link';
import { Calendar, Newspaper, TrendingUp, BarChart3, Coins, Landmark, CreditCard, PiggyBank, Wallet } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
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

function BlogPlaceholder({ category, title }: { category?: string | null; title: string }) {
  const Icon = (category && CATEGORY_ICONS[category]) || Newspaper;
  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-muted/50">
      <Icon className="h-12 w-12 text-muted-foreground/30" aria-hidden />
    </div>
  );
}

function formatDate(d?: string | null): string {
  if (!d) return '';
  return new Date(d).toLocaleDateString('tr-TR');
}

interface BlogPostCardProps {
  post: BlogPost;
  size?: 'featured' | 'default';
  loading?: 'eager' | 'lazy';
}

/**
 * Server-renderable blog post card.
 * Used by both server (initial page render) and client (pagination/filter).
 * Pure presentational — no hooks, no client APIs.
 */
export function BlogPostCard({ post, size = 'default', loading = 'lazy' }: BlogPostCardProps) {
  const isFeatured = size === 'featured';

  return (
    <Link
      href={`/blog/${post.slug}`}
      className={cn(
        'group flex overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-primary/30',
        isFeatured ? 'h-full flex-col md:flex-row' : 'h-full flex-col',
      )}
    >
      <div
        className={cn(
          'overflow-hidden bg-muted',
          isFeatured ? 'aspect-video w-full md:w-1/2' : 'aspect-video w-full',
        )}
      >
        {post.thumbnailUrl ? (
          <img
            src={post.thumbnailUrl}
            alt={post.title}
            loading={loading}
            fetchPriority={loading === 'eager' ? 'high' : undefined}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <BlogPlaceholder category={post.category} title={post.title} />
        )}
      </div>
      <div className={cn('flex flex-1 flex-col', isFeatured ? 'justify-center p-5 lg:p-8' : 'p-4')}>
        {post.category && (
          <Badge variant={isFeatured ? 'default' : 'outline'} className="mb-2 self-start">
            {post.category}
          </Badge>
        )}
        <h3
          className={cn(
            'font-semibold line-clamp-2',
            isFeatured ? 'text-xl lg:text-2xl font-bold' : 'text-sm lg:text-base',
          )}
        >
          {post.title}
        </h3>
        {post.excerpt && (
          <p
            className={cn(
              'mt-1 text-muted-foreground line-clamp-2',
              isFeatured ? 'mt-2 text-sm' : 'text-xs',
            )}
          >
            {post.excerpt}
          </p>
        )}
        <div className="mt-auto flex items-center gap-1 pt-3 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          {formatDate(post.publishedAt || post.createdAt)}
        </div>
      </div>
    </Link>
  );
}