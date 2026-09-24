import Link from 'next/link';
import { API_URL } from '@/lib/constants';
import type { BlogPost, PaginatedResponse } from '@/types';
import { SectionHead } from './parts';

/** Sunucuda render — yazı başlıkları ve linkleri ilk HTML'de (SEO) */

const CATEGORY_LABELS: Record<string, string> = {
  altin: 'Altın',
  borsa: 'Borsa',
  hisse: 'Hisse',
  doviz: 'Döviz',
  kredi: 'Kredi',
  tasarruf: 'Tasarruf',
  emeklilik: 'Emeklilik',
  yatirim: 'Yatırım',
  sigorta: 'Sigorta',
  vergi: 'Vergi',
};

async function fetchLatest(): Promise<BlogPost[]> {
  try {
    const res = await fetch(`${API_URL}/api/blogs?limit=3&status=published`, {
      next: { revalidate: 300, tags: ['blogs'] },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const json = (await res.json()) as PaginatedResponse<BlogPost>;
    return json.data ?? [];
  } catch {
    return [];
  }
}

function readingMinutes(html: string): number {
  const words = html.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

function dateOf(p: BlogPost): { iso: string; label: string } {
  const iso = p.publishedAt ?? p.createdAt;
  return {
    iso,
    label: new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Europe/Istanbul' }),
  };
}

export async function LearnSection() {
  const posts = await fetchLatest();
  if (posts.length === 0) return null;

  return (
    <section aria-labelledby="learn-title" className="mx-auto max-w-[1440px] px-4 lg:px-8">
      <SectionHead id="learn-title" eyebrow="Bilgi merkezi" title="Öğren, sonra karar ver" href="/blog" hrefLabel="Tüm yazılar" />
      <div className="grid gap-4 md:grid-cols-3">
        {posts.map((post) => {
          const d = dateOf(post);
          const cat = post.category ? CATEGORY_LABELS[post.category] ?? post.category : null;
          return (
            <article key={post.id} className="atlas-card atlas-card-link group overflow-hidden">
              <Link href={`/blog/${post.slug}`} className="flex h-full flex-col focus-visible:outline-none">
                <div className="relative aspect-[40/21] overflow-hidden border-b border-border bg-muted">
                  {post.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={post.thumbnailUrl}
                      alt=""
                      width={640}
                      height={336}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                    />
                  ) : (
                    <div className="h-full w-full bg-[radial-gradient(circle_at_30%_30%,color-mix(in_srgb,var(--color-primary)_25%,transparent),transparent_60%)]" />
                  )}
                </div>
                <div className="flex flex-1 flex-col p-5">
                  {cat && <p className="eyebrow text-primary">{cat}</p>}
                  <h3 className="font-display mt-2 text-[1.45rem] leading-tight text-foreground transition-colors group-hover:text-primary">
                    {post.title}
                  </h3>
                  {post.excerpt && <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{post.excerpt}</p>}
                  <p className="mt-auto pt-4 text-[12px] text-muted-foreground">
                    {readingMinutes(post.content ?? '')} dk okuma · <time dateTime={d.iso}>{d.label}</time>
                  </p>
                </div>
              </Link>
            </article>
          );
        })}
      </div>
    </section>
  );
}
