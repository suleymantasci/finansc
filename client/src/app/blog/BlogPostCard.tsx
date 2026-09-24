import Link from 'next/link';
import { categoryLabel } from '@/lib/blog-categories';
import { cn } from '@/lib/utils';
import type { BlogPost } from '@/types';

function formatDate(d?: string | null): string {
  if (!d) return '';
  return new Date(d).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Europe/Istanbul' });
}

function readingMinutes(html?: string | null): number | null {
  if (!html) return null;
  return Math.max(1, Math.round(html.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length / 200));
}

/** Sunucuda render edilebilen yazı kartı (hook yok). */
export function BlogPostCard({ post, size = 'default', loading = 'lazy' }: { post: BlogPost; size?: 'featured' | 'default'; loading?: 'eager' | 'lazy' }) {
  const featured = size === 'featured';
  const cat = categoryLabel(post.category);
  const mins = readingMinutes(post.content);
  const date = post.publishedAt || post.createdAt;

  return (
    <Link
      href={`/blog/${post.slug}`}
      className={cn('atlas-card atlas-card-link group flex h-full overflow-hidden', featured ? 'flex-col md:flex-row' : 'flex-col')}
    >
      <div className={cn('overflow-hidden border-border bg-muted', featured ? 'aspect-[40/21] w-full shrink-0 border-b md:w-[55%] md:self-center md:border-b-0 md:border-r' : 'aspect-[40/21] w-full border-b')}>
        {post.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.thumbnailUrl}
            alt=""
            loading={loading}
            fetchPriority={loading === 'eager' ? 'high' : undefined}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="h-full w-full bg-[radial-gradient(circle_at_30%_30%,color-mix(in_srgb,var(--color-primary)_22%,transparent),transparent_60%)]" aria-hidden="true" />
        )}
      </div>
      <div className={cn('flex flex-1 flex-col', featured ? 'justify-center p-6 lg:p-10' : 'p-5')}>
        {cat && <p className="eyebrow text-primary">{cat}</p>}
        {featured ? (
          <h2 className="font-display mt-3 text-balance text-3xl leading-tight text-foreground group-hover:text-primary lg:text-4xl">{post.title}</h2>
        ) : (
          <h3 className="font-display mt-2 line-clamp-3 text-[1.35rem] leading-snug text-foreground group-hover:text-primary">{post.title}</h3>
        )}
        {post.excerpt && <p className={cn('mt-2 text-pretty text-muted-foreground', featured ? 'line-clamp-3 text-[15px]' : 'line-clamp-2 text-sm')}>{post.excerpt}</p>}
        <p className="mt-auto pt-4 text-[12px] text-muted-foreground">
          <time dateTime={date}>{formatDate(date)}</time>
          {mins && <> · {mins} dk okuma</>}
        </p>
      </div>
    </Link>
  );
}
