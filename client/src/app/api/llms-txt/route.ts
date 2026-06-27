import { NextResponse } from 'next/server';
import { SITE_NAME, SITE_URL, API_URL } from '@/lib/constants';

export const revalidate = 3600; // 1 hour cache
export const runtime = 'nodejs';

interface BlogPost {
  title: string;
  slug: string;
  category?: string | null;
  seoDescription?: string | null;
  excerpt?: string | null;
  publishedAt?: string;
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}

/**
 * Slug-to-readable-name mappers.
 * Backend'in döndüğü isim → URL slug eşleşmesi.
 */
const GOLD_SLUGS: Record<string, string> = {
  'Gram Altın': 'gram-altin',
  'Çeyrek Altın': 'ceyrek-altin',
  'Yarım Altın': 'yarim-altin',
  'Tam Altın': 'tam-altin',
  'Cumhuriyet Altını': 'cumhuriyet-altini',
  'Ata Altın': 'ata-altin',
  'Ons Altın': 'ons-altin',
  'Gremse Altın': 'gremse-altin',
  'Bilezik': 'bilezik',
  'Gümüş': 'gumus',
  'Has Altın': 'has-altin',
};

const CURRENCY_SLUGS: Record<string, string> = {
  'USD': 'dolar',
  'EUR': 'euro',
  'GBP': 'sterlin',
  'CHF': 'frang',
  'RUB': 'ruble',
  'JPY': 'yen',
  'CNY': 'yuan',
};

const ARAC_SLUGS = [
  'ihtiyac-kredisi', 'konut-kredisi', 'tasit-kredisi', 'kobi-kredisi',
  'maas-hesaplama', 'vadeli-mevduat', 'enflasyon-hesaplama', 'reel-getiri',
  'doviz-hesaplama', 'altin-hesaplama', 'faiz-hesaplama', 'parasal-deger',
  'kira-artisi', 'tasinir-temettu', 'sermaye-temettu', 'bilesik-buyume',
  'net-bugunku-deger', 'ic-verim-orani', 'ortalama-vade', 'tahvil-hesaplama',
  'repo-hesaplama', 'eurobond-hesaplama', 'bono-hesaplama',
  'doviz-donusumu', 'altin-donusumu', 'kripto-hesaplama',
  'bireysel-emeklilik', 'saglik-hesaplama', 'mtv-hesaplama',
  'kdv-hesaplama', 'stopaj-hesaplama', 'konut-uygunluk',
  'araba-uygunluk', 'ihtiyac-kredisi-karsilastirma', 'mevduat-getirisi',
  'maliyet-enflasyon', 'reel-faiz', 'kur-koruma', 'dolar-endeksi',
  'kripto-varlik', 'fon-karsilastirma', 'risk-skoru', 'yatirim-plani',
];

async function fetchAllBlogs(): Promise<BlogPost[]> {
  try {
    const allBlogs: BlogPost[] = [];
    // İlk sayfa
    const res1 = await fetch(`${API_URL}/api/blogs?page=1&limit=50&status=published`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!res1.ok) return [];
    const firstPage = (await res1.json()) as PaginatedResponse<BlogPost>;
    allBlogs.push(...firstPage.data);
    // Sonraki sayfalar
    for (let p = 2; p <= firstPage.totalPages; p++) {
      const res = await fetch(`${API_URL}/api/blogs?page=${p}&limit=50&status=published`, {
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) break;
      const page = (await res.json()) as PaginatedResponse<BlogPost>;
      allBlogs.push(...page.data);
    }
    return allBlogs;
  } catch {
    return [];
  }
}

interface MarketItem {
  symbol?: string;
  goldType?: string;
  currency?: string;
  name?: string;
}

async function fetchMarketStocks(): Promise<string[]> {
  try {
    const res = await fetch(`${API_URL}/api/market/stocks`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return [];
    const data = (await res.json()) as MarketItem[];
    return data.map((s) => s.symbol).filter((s): s is string => !!s);
  } catch {
    return [];
  }
}

async function fetchMarketGoldSlugs(): Promise<string[]> {
  try {
    const res = await fetch(`${API_URL}/api/market/gold`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return [];
    const data = (await res.json()) as MarketItem[];
    const slugs: string[] = [];
    for (const g of data) {
      const name = g.goldType || g.name || '';
      // "Eski Çeyrek Altın" → "ceyrek-altin" (eski/yeni collapse)
      const cleanName = name.replace(/^(Eski|Yeni)\s+/, '');
      const slug = GOLD_SLUGS[cleanName];
      if (slug && !slugs.includes(slug)) slugs.push(slug);
    }
    return slugs;
  } catch {
    return [];
  }
}

/**
 * GET /llms.txt — Kısa AI engine rehberi.
 * Sitemap 813 URL → burada top 60-80 link. Detaylı liste llms-full.txt'de.
 */
export async function GET() {
  const [blogs, stocks, goldSlugs] = await Promise.all([
    fetchAllBlogs(),
    fetchMarketStocks(),
    fetchMarketGoldSlugs(),
  ]);

  // Yayın tarihine göre sırala (en yeni üstte)
  blogs.sort((a, b) => {
    const da = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
    const db = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
    return db - da;
  });

  // Popüler hisseleri öne al, sonra alfabetik
  const POPULAR_STOCKS = [
    'THYAO', 'GARAN', 'EREGL', 'AKBNK', 'TUPRS', 'BIMAS', 'ASELS',
    'KCHOL', 'SAHOL', 'YKBNK', 'ISCTR', 'VAKBN', 'HALKB', 'TCELL',
    'PETKM', 'ARCLK', 'TAVHL', 'ENKAI', 'PGSUS', 'SISE',
  ];
  const otherStocks = stocks.filter((s) => !POPULAR_STOCKS.includes(s));
  const orderedStocks = [
    ...POPULAR_STOCKS.filter((s) => stocks.includes(s)),
    ...otherStocks.slice(0, 30), // Diğerlerinden max 30
  ];

  const lines: string[] = [];
  lines.push(`# ${SITE_NAME}`);
  lines.push('');
  lines.push(
    `> Türkiye'nin bağımsız finans bilgi platformu: canlı altın, borsa, döviz verileri, ` +
    `${ARAC_SLUGS.length} finansal hesaplama aracı ve ${blogs.length} güncel finans yazısı. ` +
    `Veriler MB, BIST, TÜİK ve banka kaynaklarından derlenir.`,
  );
  lines.push('');
  lines.push(`> Site URL: ${SITE_URL}`);
  lines.push('> İçerik dili: Türkçe (tr-TR)');
  lines.push('> Yayıncı: FinansCozum (Türkiye)');
  lines.push('> Güncelleme: canlı (piyasalar), düzenli (içerik)');
  lines.push('');

  // Ana sayfa
  lines.push('## Ana Sayfa');
  lines.push(`- [FinansÇözüm Ana Sayfa](${SITE_URL}): Canlı altın, borsa, döviz, ${ARAC_SLUGS.length} hesaplama aracı`);
  lines.push(`- [Altın Fiyatları](${SITE_URL}/altin): 10+ altın türü, anlık alış-satış`);
  lines.push(`- [Borsa İstanbul](${SITE_URL}/borsa): Hisse senetleri ve endeksler`);
  lines.push(`- [Döviz Kurları](${SITE_URL}/doviz): 8+ döviz çifti`);
  lines.push(`- [Hesaplama Araçları](${SITE_URL}/araclar): ${ARAC_SLUGS.length} finansal araç`);
  lines.push(`- [Bilgi Merkezi (Blog)](${SITE_URL}/blog): ${blogs.length} finans yazısı`);
  lines.push('');

  // Popüler hisseler
  if (orderedStocks.length > 0) {
    lines.push(`## Borsa İstanbul Hisse Senetleri (top ${orderedStocks.length} / ${stocks.length} toplam)`);
    for (const sym of orderedStocks) {
      lines.push(`- [${sym} Hisse Fiyatı](${SITE_URL}/borsa/hisseler/${sym}): ${sym} canlı fiyat, grafik, analiz`);
    }
    lines.push('');
    if (otherStocks.length > 30) {
      lines.push(`> Tüm ${stocks.length} hisse için: ${SITE_URL}/llms-full.txt`);
    }
    lines.push('');
  }

  // Altın
  if (goldSlugs.length > 0) {
    const GOLD_NAMES: Record<string, string> = {
      'gram-altin': 'Gram Altın',
      'ceyrek-altin': 'Çeyrek Altın',
      'yarim-altin': 'Yarım Altın',
      'tam-altin': 'Tam Altın',
      'cumhuriyet-altini': 'Cumhuriyet Altını',
      'ata-altin': 'Ata Altın',
      'ons-altin': 'Ons Altın (XAU/USD)',
      'gremse-altin': 'Gremse Altın',
      'bilezik': 'Bilezik',
      'gumus': 'Gümüş',
      'has-altin': 'Has Altın',
    };
    lines.push(`## Altın Fiyatları (${goldSlugs.length} tür)`);
    for (const slug of goldSlugs) {
      const name = GOLD_NAMES[slug] || slug;
      lines.push(`- [${name} Fiyatı](${SITE_URL}/altin/${slug}): ${name} anlık alış-satış`);
    }
    lines.push('');
  }

  // Döviz
  lines.push('## Döviz Kurları');
  for (const [code, slug] of Object.entries(CURRENCY_SLUGS)) {
    const name = code === 'USD' ? 'ABD Doları' :
                  code === 'EUR' ? 'Euro' :
                  code === 'GBP' ? 'İngiliz Sterlini' :
                  code === 'CHF' ? 'İsviçre Frangı' :
                  code === 'RUB' ? 'Rus Rublesi' :
                  code === 'JPY' ? 'Japon Yeni' :
                  code === 'CNY' ? 'Çin Yuanı' : code;
    lines.push(`- [${code}/TRY ${name}](${SITE_URL}/doviz/${slug}): ${code} Türk Lirası canlı kur`);
  }
  lines.push('');

  // Hesaplama araçları (ilk 12 + link)
  lines.push(`## Hesaplama Araçları (${ARAC_SLUGS.length} araç)`);
  const ARAC_NAMES: Record<string, string> = {
    'ihtiyac-kredisi': 'İhtiyaç Kredisi',
    'konut-kredisi': 'Konut Kredisi',
    'tasit-kredisi': 'Taşıt Kredisi',
    'maas-hesaplama': 'Maaş',
    'vadeli-mevduat': 'Vadeli Mevduat',
    'enflasyon-hesaplama': 'Enflasyon',
    'reel-getiri': 'Reel Getiri',
    'doviz-hesaplama': 'Döviz Çevirici',
    'altin-hesaplama': 'Altın Çevirici',
    'faiz-hesaplama': 'Faiz',
    'parasal-deger': 'Parasal Değer',
    'bilesik-buyume': 'Bileşik Büyüme',
  };
  for (const slug of ARAC_SLUGS.slice(0, 12)) {
    const name = ARAC_NAMES[slug] || slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    lines.push(`- [${name} Hesaplama](${SITE_URL}/araclar/${slug}): ${name} hesaplayıcı`);
  }
  lines.push(`- [Tüm ${ARAC_SLUGS.length} Hesaplama Aracı](${SITE_URL}/araclar)`);
  lines.push('');

  // Bilgi merkezi — son 15 blog
  if (blogs.length > 0) {
    lines.push(`## Bilgi Merkezi (${blogs.length} yazı, son ${Math.min(15, blogs.length)} gösteriliyor)`);
    for (const post of blogs.slice(0, 15)) {
      const desc = post.seoDescription || post.excerpt || '';
      // Çok uzunsa kırp
      const shortDesc = desc.length > 100 ? desc.slice(0, 97) + '...' : desc;
      lines.push(`- [${post.title}](${SITE_URL}/blog/${post.slug})${shortDesc ? `: ${shortDesc}` : ''}`);
    }
    lines.push('');
    if (blogs.length > 15) {
      lines.push(`> Tüm ${blogs.length} yazı için: ${SITE_URL}/llms-full.txt`);
    }
    lines.push('');
  }

  // E-E-A-T sayfaları
  lines.push('## Hakkımızda ve Politikalar (E-E-A-T)');
  lines.push(`- [Hakkımızda](${SITE_URL}/hakkimizda): Misyon, vizyon, ekip`);
  lines.push(`- [Editör Ekibi](${SITE_URL}/editor-ekibi): İçerik editörleri ve uzmanlık alanları`);
  lines.push(`- [Kaynak Politikası](${SITE_URL}/kaynak-politikasi): Veri kaynakları, güncelleme sıklığı`);
  lines.push(`- [Düzeltme Politikası](${SITE_URL}/duzeltme-politikasi): Hata yakalama ve düzeltme süreci`);
  lines.push(`- [İletişim](${SITE_URL}/iletisim)`);
  lines.push('');

  // Sitemap & crawl
  lines.push('## Sitemap ve Crawl');
  lines.push(`- [XML Sitemap](${SITE_URL}/sitemap.xml): Tüm sayfa listesi`);
  lines.push(`- [robots.txt](${SITE_URL}/robots.txt): AI bot ve arama motoru politikası`);
  lines.push(`- [llms-full.txt](${SITE_URL}/llms-full.txt): Tüm sayfaların tam listesi`);
  lines.push('');

  const body = lines.join('\n');
  return new NextResponse(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
    },
  });
}