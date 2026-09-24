import { Suspense } from 'react';
import type { Metadata } from 'next';
import { SectionIntro } from '@/components/shared/SectionIntro';
import { Breadcrumb } from '@/components/shared/Breadcrumb';
import { categoryLabel } from '@/lib/blog-categories';
import { BlogPostCard } from './BlogPostCard';
import { PaginationLinks } from './PaginationLinks';
import { BlogListInteractive } from './BlogListInteractive';
import { BlogListAdSlot } from './BlogListAdSlot';
import { API_URL } from '@/lib/constants';
import type { BlogPost, PaginatedResponse } from '@/types';

export const metadata: Metadata = {
  title: 'Bilgi Merkezi',
  description:
    'Piyasa analizleri, finansal rehberler ve güncel yorumlar. Borsa, altın, döviz, kredi ve yatırım konularında editör ekibimizin hazırladığı içerikler.',
  keywords: ['finans bilgi merkezi', 'piyasa analizi', 'yatırım rehberi', 'borsa haberleri'],
  alternates: { canonical: 'https://finanscozum.net/blog' },
};

// Re-fetch every 5 minutes — fresh blog list, no stale content
export const revalidate = 300;

interface BlogPageProps {
  searchParams: Promise<{ sayfa?: string; kategori?: string }>;
}

async function fetchBlogs(page: number, category: string | null): Promise<PaginatedResponse<BlogPost> | null> {
  try {
    const params = new URLSearchParams({
      page: String(page),
      limit: '10',
      status: 'published',
    });
    if (category) params.set('category', category);

    const res = await fetch(`${API_URL}/api/blogs?${params}`, {
      next: { revalidate: 300, tags: ['blogs'] },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    return (await res.json()) as PaginatedResponse<BlogPost>;
  } catch {
    return null;
  }
}

/** Tüm yayınlanmış yazıların kategorileri (büyük/küçük harf varyantları birleşik, çoğunluk yazımı) */
async function fetchCategories(): Promise<[string, number][]> {
  try {
    const res = await fetch(`${API_URL}/api/blogs?limit=200&status=published`, { next: { revalidate: 3600, tags: ['blogs'] }, signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];
    const json = (await res.json()) as { data?: BlogPost[] };
    const groups = new Map<string, Map<string, number>>();
    for (const p of json.data ?? []) {
      if (!p.category) continue;
      const k = p.category.toLocaleLowerCase('tr-TR');
      const g = groups.get(k) ?? new Map<string, number>();
      g.set(p.category, (g.get(p.category) ?? 0) + 1);
      groups.set(k, g);
    }
    return [...groups.values()]
      .map((g) => {
        const variants = [...g.entries()].sort((a, b) => b[1] - a[1]);
        return [variants[0][0], variants.reduce((n, v) => n + v[1], 0)] as [string, number];
      })
      .sort((a, b) => b[1] - a[1]);
  } catch {
    return [];
  }
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const sp = await searchParams;
  const currentPage = Math.max(1, Number(sp.sayfa) || 1);
  const category = sp.kategori || null;

  const initial = await fetchBlogs(currentPage, category);
  const posts = initial?.data ?? [];
  const totalPages = initial?.totalPages ?? 1;

  const categories = await fetchCategories();

  // featured + rest split for SEO-friendly layout
  const featured = posts.find((p) => p.isFeatured) || posts[0];
  const rest = posts.filter((p) => p.id !== featured?.id);

  return (
    <>
      {/* Server-rendered H1 — Pit 11 fix (client island içinde olsaydı H1 boş kalırdı) */}
      <div className="mx-auto max-w-[1440px] px-4 pt-6 lg:px-8">
        <Breadcrumb items={[{ label: 'Ana Sayfa', href: '/' }, { label: 'Bilgi Merkezi' }]} />
        <SectionIntro
          as="page"
          eyebrow="Bilgi merkezi"
          title={category ? `${categoryLabel(category)} yazıları` : 'Öğren, sonra karar ver'}
          description="Piyasa analizleri, finansal rehberler ve güncel yorumlar. Borsa, altın, döviz, kredi ve yatırım konularında editör ekibimizin hazırladığı içerikler."
        />
      </div>

      <div className="mx-auto max-w-[1440px] px-4 pb-24 lg:px-8 md:pb-12">
        {/* Category filter (client island — only category switching needs JS) */}
        <BlogListInteractive categories={categories} activeCategory={category} />

        {posts.length === 0 ? (
          <p className="py-12 text-center text-muted-foreground">Henüz yazı bulunmuyor.</p>
        ) : (
          <>
            {/* Featured post — server-rendered for instant paint */}
            {featured && (
              <div className="mb-10">
                <BlogPostCard post={featured} size="featured" loading="eager" />
              </div>
            )}

            {/* Tüm Yazılar H2 — server-rendered */}
            {rest.length > 0 && (
              <h2 className="font-display mb-5 text-3xl text-foreground">{category ? `Tüm ${categoryLabel(category)?.toLocaleLowerCase('tr-TR')} yazıları` : 'Son yazılar'}</h2>
            )}

            {/* Grid — server-rendered, with ad slot injected in the 3rd position */}
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {rest.map((post, i) => (
                <BlogPostCard key={post.id} post={post} />
              ))}
              {/* In-feed ad appears after position 3 (matches original behavior) */}
              <BlogListAdSlot position={rest.length} />
            </div>

            {/* Pagination — server-rendered <a> tags so Googlebot can crawl them */}
            <PaginationLinks currentPage={currentPage} totalPages={totalPages} category={category} />

            {/* Bottom ad slot (was in BlogListClient; keeping parity) */}
            <BlogListAdSlot position={-1} />
          </>
        )}
      </div>
    </>
  );
}