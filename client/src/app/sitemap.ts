import type { MetadataRoute } from 'next';
import { STOCK_META } from '@/lib/seo-data/stocks';
import { GOLD_META } from '@/lib/seo-data/gold';
import { CURRENCY_SLUGS } from '@/lib/seo-data/currency';
import { INDEX_SYMBOLS } from '@/lib/seo-data/indices';

const BASE_URL = 'https://finanscozum.net';
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface BlogItem {
  slug: string;
  updatedAt: string;
  publishedAt: string | null;
}

interface ToolItem {
  slug: string;
  updatedAt: string;
}

async function fetchAllBlogs(): Promise<BlogItem[]> {
  try {
    const items: BlogItem[] = [];
    let page = 1;
    let totalPages = 1;

    do {
      const res = await fetch(`${API_BASE}/api/blogs?page=${page}&limit=50&status=published`, {
        next: { revalidate: 3600 },
      });
      if (!res.ok) break;
      const data = await res.json();
      items.push(...data.data);
      totalPages = data.totalPages;
      page++;
    } while (page <= totalPages);

    return items;
  } catch {
    return [];
  }
}

async function fetchAllTools(): Promise<ToolItem[]> {
  try {
    const res = await fetch(`${API_BASE}/api/tools?active=true`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export const revalidate = 3600; // 1 saatte bir yeniden oluştur

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [blogs, tools] = await Promise.all([fetchAllBlogs(), fetchAllTools()]);

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'hourly', priority: 1 },
    { url: `${BASE_URL}/altin`, lastModified: new Date(), changeFrequency: 'hourly', priority: 0.9 },
    { url: `${BASE_URL}/borsa`, lastModified: new Date(), changeFrequency: 'hourly', priority: 0.9 },
    { url: `${BASE_URL}/borsa/hisseler`, lastModified: new Date(), changeFrequency: 'hourly', priority: 0.8 },
    { url: `${BASE_URL}/doviz`, lastModified: new Date(), changeFrequency: 'hourly', priority: 0.9 },
    { url: `${BASE_URL}/blog`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE_URL}/araclar`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/hakkimizda`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE_URL}/iletisim`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
  ];

  const blogPages: MetadataRoute.Sitemap = blogs.map((post) => ({
    url: `${BASE_URL}/blog/${post.slug}`,
    lastModified: new Date(post.updatedAt),
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  const toolPages: MetadataRoute.Sitemap = tools.map((tool) => ({
    url: `${BASE_URL}/araclar/${tool.slug}`,
    lastModified: new Date(tool.updatedAt),
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  // Programmatic SEO sayfaları — lastModified saatlik değişim yansıtır
  // (İlk deploy'da static; ileride API'den gerçek "son veri güncelleme" çekilebilir)
  const stockPages: MetadataRoute.Sitemap = Object.keys(STOCK_META).map((symbol) => ({
    url: `${BASE_URL}/borsa/hisseler/${symbol}`,
    lastModified: new Date(),
    changeFrequency: 'hourly' as const,
    priority: 0.8,
  }));

  const goldPages: MetadataRoute.Sitemap = Object.values(GOLD_META).map((g) => ({
    url: `${BASE_URL}/altin/${g.slug}`,
    lastModified: new Date(),
    changeFrequency: 'hourly' as const,
    priority: 0.9,
  }));

  const currencyPages: MetadataRoute.Sitemap = CURRENCY_SLUGS.map((slug) => ({
    url: `${BASE_URL}/doviz/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'hourly' as const,
    priority: 0.9,
  }));

  const indexPages: MetadataRoute.Sitemap = INDEX_SYMBOLS.map((symbol) => ({
    url: `${BASE_URL}/borsa/endeksler/${symbol}`,
    lastModified: new Date(),
    changeFrequency: 'hourly' as const,
    priority: 0.8,
  }));

  return [
    ...staticPages,
    ...stockPages,
    ...goldPages,
    ...currencyPages,
    ...indexPages,
    ...blogPages,
    ...toolPages,
  ];
}
