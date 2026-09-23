import { TOOL_META } from '@/lib/seo-data/tools';
import { GOLD_META } from '@/lib/seo-data/gold';
import { CURRENCIES } from '@/lib/instruments/currencies';
import { COMMODITIES } from '@/lib/instruments/commodities';
import { GRAM_AMOUNTS } from '@/lib/seo-data/altin-amounts';
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

interface MarketItem {
  symbol?: string;
  goldType?: string;
  currency?: string;
  name?: string;
}

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

// Gerçek araç listesi (seo-data/tools) — elle liste kırık link üretiyordu
const ARAC_SLUGS = Object.keys(TOOL_META);

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

const ARAC_NAMES: Record<string, string> = {
  'ihtiyac-kredisi': 'İhtiyaç Kredisi',
  'konut-kredisi': 'Konut Kredisi',
  'tasit-kredisi': 'Taşıt Kredisi',
  'kobi-kredisi': 'KOBİ Kredisi',
  'maas-hesaplama': 'Maaş',
  'vadeli-mevduat': 'Vadeli Mevduat',
  'enflasyon-hesaplama': 'Enflasyon',
  'reel-getiri': 'Reel Getiri',
  'doviz-hesaplama': 'Döviz Çevirici',
  'altin-hesaplama': 'Altın Çevirici',
  'faiz-hesaplama': 'Faiz',
  'parasal-deger': 'Parasal Değer',
  'kira-artisi': 'Kira Artışı',
  'tasinir-temettu': 'Taşınır Temettü',
  'sermaye-temettu': 'Sermaye Temettü',
  'bilesik-buyume': 'Bileşik Büyüme',
  'net-bugunku-deger': 'Net Bugünkü Değer',
  'ic-verim-orani': 'İç Verim Oranı',
  'ortalama-vade': 'Ortalama Vade',
  'tahvil-hesaplama': 'Tahvil',
  'repo-hesaplama': 'Repo',
  'eurobond-hesaplama': 'Eurobond',
  'bono-hesaplama': 'Bono',
  'doviz-donusumu': 'Döviz Dönüşümü',
  'altin-donusumu': 'Altın Dönüşümü',
  'kripto-hesaplama': 'Kripto',
  'bireysel-emeklilik': 'BES',
  'saglik-hesaplama': 'Sağlık',
  'mtv-hesaplama': 'MTV',
  'kdv-hesaplama': 'KDV',
  'stopaj-hesaplama': 'Stopaj',
  'konut-uygunluk': 'Konut Uygunluk',
  'araba-uygunluk': 'Araba Uygunluk',
  'ihtiyac-kredisi-karsilastirma': 'Kredi Karşılaştırma',
  'mevduat-getirisi': 'Mevduat Getirisi',
  'maliyet-enflasyon': 'Maliyet Enflasyonu',
  'reel-faiz': 'Reel Faiz',
  'kur-koruma': 'Kur Koruma',
  'dolar-endeksi': 'Dolar Endeksi',
  'kripto-varlik': 'Kripto Varlık',
  'fon-karsilastirma': 'Fon Karşılaştırma',
  'risk-skoru': 'Risk Skoru',
  'yatirim-plani': 'Yatırım Planı',
};

async function fetchAllBlogs(): Promise<BlogPost[]> {
  try {
    const allBlogs: BlogPost[] = [];
    const res1 = await fetch(`${API_URL}/api/blogs?page=1&limit=50&status=published`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!res1.ok) return [];
    const firstPage = (await res1.json()) as PaginatedResponse<BlogPost>;
    allBlogs.push(...firstPage.data);
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

async function fetchMarketStocks(): Promise<string[]> {
  try {
    const res = await fetch(`${API_URL}/api/market/stocks`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return [];
    const data = (await res.json()) as MarketItem[];
    // Upstream listesinin başlık satırı ('code') sembol değildir
    return data.map((s) => s.symbol).filter((s): s is string => !!s && /^[A-Z][A-Z0-9]{2,6}$/.test(s)).sort();
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
 * GET /llms-full.txt — Tam AI engine rehberi.
 * Tüm dinamik sayfaları içerir: hisseler, altın, döviz, araçlar, blog.
 * Otomatik güncellenir: yeni hisse/yazı/araç eklenince bir sonraki istekte görünür.
 */
export async function GET() {
  const [blogs, stocks] = await Promise.all([
    fetchAllBlogs(),
    fetchMarketStocks(),
  ]);
  const goldSlugs = Object.keys(GOLD_META);

  // Blog'ları tarihe göre sırala (en yeni üstte)
  blogs.sort((a, b) => {
    const da = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
    const db = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
    return db - da;
  });

  const now = new Date().toISOString();
  const totalUrls =
    6 + // ana sayfalar
    stocks.length + // hisseler
    goldSlugs.length + // altın
    7 + // döviz
    ARAC_SLUGS.length + // araçlar
    blogs.length + // blog
    5; // eeat

  const lines: string[] = [];
  lines.push(`# ${SITE_NAME} — Full Index (llms-full.txt)`);
  lines.push('');
  lines.push(
    `> Türkiye'nin bağımsız finans bilgi platformu. Bu dosya tüm yayınlanmış ` +
    `sayfaların tam listesini içerir. AI engine'lerin (ChatGPT, Perplexity, Claude, Gemini) ` +
    `sitenin tamamını keşfetmesi içindir.`,
  );
  lines.push('');
  lines.push(`> Toplam URL: ${totalUrls}`);
  lines.push(`> Son güncelleme: ${now}`);
  lines.push(`> Site URL: ${SITE_URL}`);
  lines.push(`> Veri kaynakları: BIST, TCMB, TÜİK, banka kaynakları`);
  lines.push('');

  // ── Ana Sayfalar ──
  lines.push(`## Ana Sayfalar (6 URL)`);
  lines.push('');
  lines.push(`- [Ana Sayfa](${SITE_URL}): Canlı altın, borsa, döviz ve hesaplama araçları`);
  lines.push(`- [Altın Fiyatları](${SITE_URL}/altin): Tüm altın türleri, fiyat karşılaştırma`);
  lines.push(`- [Borsa İstanbul](${SITE_URL}/borsa): Hisse senetleri ve endeksler`);
  lines.push(`- [Döviz Kurları](${SITE_URL}/doviz): Döviz çiftleri ve çevirici`);
  lines.push(`- [Hesaplama Araçları](${SITE_URL}/araclar): ${ARAC_SLUGS.length} finansal araç`);
  lines.push(`- [Bilgi Merkezi](${SITE_URL}/blog): Blog yazıları`);
  lines.push('');

  // ── BIST Hisse Senetleri ──
  lines.push(`## Borsa İstanbul Hisse Senetleri (${stocks.length} hisse)`);
  lines.push('');
  for (const sym of stocks) {
    lines.push(`- [${sym} Hisse Fiyatı](${SITE_URL}/borsa/hisseler/${sym}): ${sym} canlı fiyat, grafik, teknik ve temel analiz`);
  }
  lines.push('');

  // ── Endeksler ──
  lines.push('## BIST Endeksleri');
  lines.push('');
  const endeksler = ['XU100', 'XU030', 'XBANK', 'XUTEK', 'XKURY', 'XHOLD', 'XGMYO', 'XUMAL'];
  for (const idx of endeksler) {
    lines.push(`- [${idx} Endeksi](${SITE_URL}/borsa/endeksler/${idx}): ${idx} anlık değer ve bileşen hisseler`);
  }
  lines.push('');

  // ── Altın ──
  lines.push(`## Altın Fiyatları (${goldSlugs.length} tür)`);
  lines.push('');
  for (const slug of goldSlugs) {
    const name = GOLD_META[slug]?.name || slug;
    lines.push(`- [${name}](${SITE_URL}/altin/${slug}): ${name} alış-satış fiyatı, günlük değişim, grafik`);
  }
  // Miktar sayfaları (sitemap'te var)
  const miktarSayfalar = GRAM_AMOUNTS;
  lines.push('');
  lines.push(`### Altın Miktar Çevirici`);
  lines.push('');
  for (const m of miktarSayfalar) {
    lines.push(`- [${m.title}](${SITE_URL}${m.path})`);
  }
  lines.push('');

  // ── Döviz ──
  lines.push('## Döviz Kurları');
  lines.push('');
  for (const c of CURRENCIES) {
    lines.push(`- [${c.code}/TRY ${c.name}](${SITE_URL}/doviz/${c.slug}): ${c.name} kuru — ${[c.serbestName && 'serbest piyasa', c.tcmbName && 'TCMB'].filter(Boolean).join(' ve ')}`);
  }
  lines.push('');

  // Emtia (günlük kapanış)
  lines.push(`## Emtia Fiyatları (${COMMODITIES.length} emtia, günlük kapanış)`);
  lines.push(`- [Tüm emtialar](${SITE_URL}/emtia): Enerji, değerli metal, endüstriyel metal ve tarım ürünleri`);
  for (const c of COMMODITIES) {
    lines.push(`- [${c.name}](${SITE_URL}/emtia/${c.slug}): ${c.name} fiyatı (${c.unit}), geçmiş grafik`);
  }
  lines.push('');

  // ── Hesaplama Araçları ──
  lines.push(`## Hesaplama Araçları (${ARAC_SLUGS.length} araç)`);
  lines.push('');
  for (const slug of ARAC_SLUGS) {
    const name = TOOL_META[slug]?.title ?? slug;
    lines.push(`- [${name}](${SITE_URL}/araclar/${slug}): ${name} online hesaplayıcı`);
  }
  lines.push('');

  // ── Bilgi Merkezi (Blog) ──
  lines.push(`## Bilgi Merkezi — Blog Yazıları (${blogs.length} yazı)`);
  lines.push('');
  if (blogs.length === 0) {
    lines.push('*Şu an yayında yazı yok.*');
  } else {
    for (const post of blogs) {
      const desc = post.seoDescription || post.excerpt || '';
      const shortDesc = desc.length > 120 ? desc.slice(0, 117) + '...' : desc;
      lines.push(`- [${post.title}](${SITE_URL}/blog/${post.slug})${shortDesc ? `: ${shortDesc}` : ''}`);
    }
  }
  lines.push('');

  // ── E-E-A-T ──
  lines.push('## Hakkımızda ve Politikalar (E-E-A-T)');
  lines.push('');
  lines.push(`- [Hakkımızda](${SITE_URL}/hakkimizda): Misyon, vizyon, ekip, bağımsızlık beyanı`);
  lines.push(`- [Editör Ekibi](${SITE_URL}/editor-ekibi): İçerik editörleri ve finansal uzmanlık alanları`);
  lines.push(`- [Kaynak Politikası](${SITE_URL}/kaynak-politikasi): Veri kaynakları, güncelleme sıklığı, doğrulama`);
  lines.push(`- [Düzeltme Politikası](${SITE_URL}/duzeltme-politikasi): Hata yakalama, kullanıcı bildirimi, düzeltme süreci`);
  lines.push(`- [İletişim](${SITE_URL}/iletisim): Basın, işbirliği, editör iletişim`);
  lines.push('');

  // ── Yasal ──
  lines.push('## Yasal');
  lines.push('');
  lines.push(`- [Gizlilik Politikası](${SITE_URL}/gizlilik)`);
  lines.push(`- [Kullanım Şartları](${SITE_URL}/kullanim-sartlari)`);
  lines.push('');

  // ── Crawl hints ──
  lines.push('## Crawl Bilgileri');
  lines.push('');
  lines.push(`- [XML Sitemap](${SITE_URL}/sitemap.xml): Tüm sayfalar`);
  lines.push(`- [robots.txt](${SITE_URL}/robots.txt): Bot politikası`);
  lines.push(`- [llms.txt](${SITE_URL}/llms.txt): Özet rehber`);
  lines.push('');

  const body = lines.join('\n');
  return new NextResponse(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
    },
  });
}