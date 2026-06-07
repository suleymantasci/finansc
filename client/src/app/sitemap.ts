import type { MetadataRoute } from 'next';
import { GOLD_META } from '@/lib/seo-data/gold';
import { CURRENCY_SLUGS } from '@/lib/seo-data/currency';
import { INDEX_SYMBOLS } from '@/lib/seo-data/indices';
import { GRAM_AMOUNTS, PIECE_AMOUNTS } from '@/lib/seo-data/altin-amounts';
import { getKnownStockSymbols, getWhitelistMeta } from '@/lib/seo-data/whitelist';

const BASE_URL = 'https://finanscozum.net';
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// ── Fallback data — API erişilemezse veya boş dönerse kullanılır ───────────
// Yeni blog/araç eklendiğinde buraya slug ekle; otomatik sitemap için API'ye güven
const FALLBACK_BLOG_SLUGS = [
  'altin-fiyatlarini-etkileyen-faktorler-2026',
  'doviz-arbitraj-nedir-2026',
  'bist-hisse-senedi-secimi-yeni-baslayanlar',
  'bireysel-emeklilik-sistemi-bes-2026',
  'enflasyon-nedir-bireyler-uzerindeki-etkisi-ve-korunma-yollari',
  'basit-faiz-ve-bilesik-faiz-farklari-formulleri-ve-yatirima-etkisi',
  'fiziki-altin-yatirim-yontemleri',
  'doviz-kurlari-neden-degisiyor-2026',
  'kredi-notu-nedir-nasil-yukseltilir',
  'altin-yatirim-rehberi-2026',
  'borsada-risk-yonetimi-stratejileri',
  'doviz-ve-altin-arasinda-yatirim',
  'faiz-oranlari-ve-sermaye-piyasasi',
];

const FALLBACK_TOOL_SLUGS = [
  'ihtiyac-kredisi','konut-kredisi','tasit-kredisi','is-yeri-kredisi','ticari-kredi',
  'ticari-ihtiyac-kredisi','ticari-arac-kredisi','kredi-hesaplama','ne-kadar-kredi-alabilirim',
  'kredi-dosya-masrafi','kredi-erken-kapatma','kredi-gecikme-faizi','kredi-yapilandirma',
  'kredi-yillik-maliyet-orani','kredi-karti-asgari-odeme','kredi-karti-ek-taksit',
  'kredi-karti-gecikme-faizi','kredi-karti-islem-taksitlendirme','kredi-karti-taksitli-nakit-avans',
  'altin-hesaplama','doviz-hesaplama','faiz-hesaplama','vadeli-mevduat','bono-hesaplama',
  'tahvil-hesaplama','repo-hesaplama','eurobond-hesaplama','birikim-hesaplama',
  'enflasyon-hesaplama','bilesik-buyume','reel-getiri','kira-artis-orani',
  'parasal-deger','net-bugunku-deger','ic-verim-orani','ic-dis-iskonto',
  'ortalama-vade','vadeli-islem-fiyati','sermaye-temettu','gecmis-altin-fiyatlari',
  'gecmis-doviz-kurlari','iban-dogrulama',
];

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
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) break;
      const data = await res.json();
      items.push(...(data.data ?? []));
      totalPages = data.totalPages ?? 1;
      page++;
    } while (page <= totalPages);

    return items.length > 0 ? items : [];
  } catch {
    return [];
  }
}

async function fetchAllTools(): Promise<ToolItem[]> {
  try {
    const res = await fetch(`${API_BASE}/api/tools?active=true`, {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export const revalidate = 3600;

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

  // Blog sayfaları — API'den veya fallback'ten
  const blogPages: MetadataRoute.Sitemap = (blogs.length > 0 ? blogs : FALLBACK_BLOG_SLUGS).map((item) => ({
    url: `${BASE_URL}/blog/${typeof item === 'string' ? item : item.slug}`,
    lastModified: typeof item === 'string' ? new Date() : new Date(item.updatedAt),
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  // Araç sayfaları — API'den veya fallback'ten
  const toolPages: MetadataRoute.Sitemap = (tools.length > 0 ? tools : FALLBACK_TOOL_SLUGS).map((item) => ({
    url: `${BASE_URL}/araclar/${typeof item === 'string' ? item : item.slug}`,
    lastModified: typeof item === 'string' ? new Date() : new Date(item.updatedAt),
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  // Hisse sayfaları: whitelist'ten (build-time API fetch + 24h cache).
  // 615 gerçek BIST sembolünün HEPSİ sitemap'te → Google hepsini keşfeder.
  // getWhitelistMeta kaynak bilgisini loglar (debug/monitoring).
  const knownSymbols = await getKnownStockSymbols();
  const whitelistMeta = await getWhitelistMeta();
  // eslint-disable-next-line no-console
  console.log(
    `[sitemap] hisse sembolleri: ${whitelistMeta.count} (kaynak: ${whitelistMeta.source})`,
  );
  const stockPages: MetadataRoute.Sitemap = knownSymbols.map((symbol) => ({
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

  const gramAmountPages: MetadataRoute.Sitemap = GRAM_AMOUNTS.map((g) => ({
    url: `${BASE_URL}${g.path}`,
    lastModified: new Date(),
    changeFrequency: 'hourly' as const,
    priority: 0.7,
  }));

  const pieceAmountPages: MetadataRoute.Sitemap = PIECE_AMOUNTS.map((p) => ({
    url: `${BASE_URL}${p.path}`,
    lastModified: new Date(),
    changeFrequency: 'hourly' as const,
    priority: 0.7,
  }));

  return [
    ...staticPages,
    ...stockPages,
    ...goldPages,
    ...currencyPages,
    ...indexPages,
    ...gramAmountPages,
    ...pieceAmountPages,
    ...blogPages,
    ...toolPages,
  ];
}
