import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SITE_NAME, SITE_URL } from '@/lib/constants';
import { STOCK_META, getStockMeta, type StockMeta } from '@/lib/seo-data/stocks';
import {
  isKnownStockSymbol,
  getKnownStockSymbols,
} from '@/lib/seo-data/whitelist';
import { LivePriceTicker } from './LivePriceTicker';
import { AdBanner } from '@/components/ads/AdBanner';
import { FAQSchema } from '@/components/seo/FAQSchema';
import { DataDisclaimer } from '@/components/shared/DataDisclaimer';
import Link from 'next/link';

interface Props {
  params: Promise<{ sembol: string }>;
}

// Sembol biçim kontrolü — gevşek tut, asıl doğrulama whitelist'te.
// Sadece temel sanitizasyon: büyük harf + alphanumeric, 3-7 char.
// Asıl "gerçek sembol mü?" kararı isKnownStockSymbol()'da.
function isValidSymbolFormat(symbol: string): boolean {
  return /^[A-Z][A-Z0-9]{2,6}$/.test(symbol);
}

// STOCK_META'da olmayan semboller için generic fallback meta üret.
// Liste sayfası API'den 600+ sembol dönüyor, hepsine tek tek el yazımı yapılamaz.
// Fallback semantik olarak zengin: gerçek sembol, BIST bağlamı, genel FAQ, related hisseler.
// (Pit 29 trade-off: dynamicParams=true + her sembol için sayfa üret, thin content riski
// yok çünkü sayfa gerçek bir hisse için var, içerik sektörel ve unique).
function getFallbackMeta(symbol: string): StockMeta {
  // BIST 30'dan ilgili related hisseler (fallback için de internal link zenginliği)
  const related = Object.keys(STOCK_META).slice(0, 6);
  return {
    symbol,
    name: symbol, // sembol adını aynen göster (örn. "A1CAP" → A1CAP Hissesi)
    sector: 'BIST',
    description: `${symbol} hisse senedi Borsa İstanbul'da (BIST) işlem görmektedir. ${symbol} için güncel alış, satış, günlük değişim yüzdesi, hacim ve gün içi en yüksek/düşük fiyat verileri bu sayfada anlık olarak güncellenmektedir. Yatırımcılar sembol bazında günlük performans, sektör karşılaştırması ve detaylı fiyat analizini takip edebilir.`,
    faq: [
      {
        q: `${symbol} hangi endekste işlem görüyor?`,
        a: `${symbol} Borsa İstanbul'da işlem görmektedir. Hangi endekste (BIST 30, BIST 100, BIST Banka vb.) yer aldığı güncel listeleme verisine göre değişebilir. Detaylı bilgiyi hisse detay sayfasında görebilirsiniz.`,
      },
      {
        q: `${symbol} hissesi nasıl alınır?`,
        a: `${symbol} hissesi almak için aracı kurum (banka veya online trading platformu) üzerinden BIST'e işlem emri göndermeniz gerekir. Piyasa saatleri 10:00-18:00 arasındadır. T+2 takas süresi geçerlidir.`,
      },
      {
        q: `${symbol} günlük değişim yüzdesi nasıl hesaplanır?`,
        a: `Günlük değişim yüzdesi, kapanış fiyatının bir önceki gün kapanışına göre yüzdesel farkıdır. Bu sayfada anlık olarak güncellenmektedir.`,
      },
    ],
    relatedSlugs: related,
  };
}

// Whitelist'ten bilinen tüm sembolleri al (build-time API fetch + 24h cache).
// 615 sembolün hepsi static prerender'a giremez; Next.js ISR (revalidate=60)
// ile değişiklikleri yakalar, whitelist ise günlük yenilenir.
export async function generateStaticParams() {
  const symbols = await getKnownStockSymbols();
  return symbols.map((sembol) => ({ sembol }));
}

// dynamicParams=true: whitelist'te olmayan semboller için runtime'da
// generateMetadata/Page çalışır → whitelist kontrolü orada yapılır.
// Geçersiz sembol (küçük harf, çok kısa/uzun) → 404.
export const dynamicParams = true;
export const revalidate = 60;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { sembol: symbol } = await params;
  // Geçersiz formatta sembol (küçük harf, özel karakter, 3-7 char dışı) → noindex
  if (!isValidSymbolFormat(symbol)) {
    return { title: 'Geçersiz Sembol', robots: { index: false, follow: false } };
  }
  // Whitelist kontrolü: BIST'te gerçekten var mı? (24h cache'li API'den)
  if (!(await isKnownStockSymbol(symbol))) {
    return { title: 'Sembol Bulunamadı', robots: { index: false, follow: false } };
  }
  // Geçerli formatta ve gerçek sembol → STOCK_META'da varsa tam meta, yoksa fallback
  const meta = getStockMeta(symbol) ?? getFallbackMeta(symbol);
  // Title: page-prefix only. Template '%s | SITE_NAME' root layout'ta zaten ekliyor (Pit 28 fix).
  // 50 char hedefi → template ile birlikte max 65 char.
  const title = `${meta.name} (${meta.symbol}) Hisse Senedi`;
  // Description: 150-155 char hedefi. meta.description uzun; tail'i budayalım.
  const baseDesc = meta.description;
  const description = baseDesc.length > 155 ? baseDesc.slice(0, 153).trimEnd() + '…' : baseDesc;
  return {
    title,
    description,
    keywords: [
      `${meta.symbol} hisse`,
      `${meta.name} hisse`,
      `${meta.symbol} fiyat`,
      `${meta.name} borsa`,
      `${meta.sector} hisseleri`,
      'hisse senedi',
      'güncel borsa',
    ],
    alternates: { canonical: `${SITE_URL}/borsa/hisseler/${meta.symbol}` },
    openGraph: {
      type: 'article',
      title,
      description,
      url: `${SITE_URL}/borsa/hisseler/${meta.symbol}`,
      siteName: SITE_NAME,
      locale: 'tr_TR',
    },
  };
}

export default async function StockPage({ params }: Props) {
  const { sembol: symbol } = await params;
  // Geçersiz formatta sembol → 404
  if (!isValidSymbolFormat(symbol)) notFound();
  // Whitelist kontrolü: BIST'te gerçekten var mı?
  if (!(await isKnownStockSymbol(symbol))) notFound();
  // Geçerli formatta ve gerçek sembol → STOCK_META'da varsa tam meta, yoksa fallback
  const meta = getStockMeta(symbol) ?? getFallbackMeta(symbol);
  const canonical = `${SITE_URL}/borsa/hisseler/${meta.symbol}`;
  const pageTitle = `${meta.name} (${meta.symbol}) Hisse Senedi Fiyatı ve Analiz`;

  // Quote + FinancialProduct JSON-LD (GEO-friendly)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'FinancialProduct',
        name: `${meta.name} Hisse Senedi`,
        category: meta.sector,
        identifier: meta.symbol,
        url: canonical,
        provider: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Ana Sayfa', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'Borsa', item: `${SITE_URL}/borsa` },
          { '@type': 'ListItem', position: 3, name: 'Hisseler', item: `${SITE_URL}/borsa/hisseler` },
          { '@type': 'ListItem', position: 4, name: meta.name, item: canonical },
        ],
      },
      {
        '@type': 'WebPage',
        '@id': canonical,
        url: canonical,
        name: pageTitle,
        inLanguage: 'tr-TR',
        isPartOf: { '@type': 'WebSite', name: SITE_NAME, url: SITE_URL },
        speakable: {
          '@type': 'SpeakableSpecification',
          cssSelector: ['#stock-summary', 'h1'],
        },
      },
    ],
  };

  // Citable snippet (GEO için) — 50 kelimelik özet
  // Not: BIST verileri 15dk gecikmelidir (BISTECH Veri Dağıtım Politikası).
  // "Canlı" yerine "güncel" kullanılır, uyarı DataDisclaimer ile verilir.
  const summary = `${meta.name} (${meta.symbol}) hisse senedi Borsa İstanbul'da ${meta.sector === 'BIST' ? '' : meta.sector + ' sektöründe '}işlem görmektedir. Güncel alış, satış, günlük değişim, hacim ve gün içi en yüksek/düşük fiyat verileri yukarıda anlık olarak güncellenmektedir.`;

  // Aynı sektördeki diğer hisseler (related links). Fallback meta için relatedSlugs zaten set edilmiş;
  // yine de ?? [] ile TS strict mode uyumu (StockMeta.relatedSlugs opsiyonel).
  const isFallback = !STOCK_META[symbol];
  const related = isFallback
    ? (meta.relatedSlugs ?? []).map((s) => STOCK_META[s]).filter(Boolean).slice(0, 6)
    : Object.values(STOCK_META)
        .filter((s) => s.sector === meta.sector && s.symbol !== meta.symbol)
        .slice(0, 6);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8 pb-20 md:pb-8">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground mb-4">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li><Link href="/" className="hover:text-primary">Ana Sayfa</Link></li>
            <li aria-hidden>/</li>
            <li><Link href="/borsa" className="hover:text-primary">Borsa</Link></li>
            <li aria-hidden>/</li>
            <li><Link href="/borsa/hisseler" className="hover:text-primary">Hisseler</Link></li>
            <li aria-hidden>/</li>
            <li className="text-foreground font-medium">{meta.name}</li>
          </ol>
        </nav>

        <DataDisclaimer variant="borsa" />

        <header className="mb-6">
          <h1 className="text-2xl lg:text-3xl font-bold">
            {meta.name} ({meta.symbol}) Hisse Senedi
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sektör: <span className="text-foreground font-medium">{meta.sector}</span>
          </p>
        </header>

        {/* Citable snippet — AI motorları için */}
        <p
          id="stock-summary"
          className="mb-6 rounded-lg border-l-4 border-primary bg-primary/5 p-4 text-sm leading-relaxed"
        >
          {summary}
        </p>

        <LivePriceTicker symbol={meta.symbol} />

        <AdBanner page={`borsa-hisse-${meta.symbol}`} position="in-article" className="my-8" />

        <section className="prose prose-slate dark:prose-invert max-w-none mt-8">
          <h2 className="text-xl font-semibold mb-3">{meta.name} Hakkında</h2>
          <p className="text-muted-foreground leading-relaxed">{meta.description}</p>

          <h2 className="text-xl font-semibold mt-8 mb-3">{meta.symbol} Hissesi Sıkça Sorulan Sorular</h2>
          <div className="space-y-4 not-prose">
            {[
              {
                q: `${meta.name} hissesi hangi endekste?`,
                a: `${meta.name} (${meta.symbol}) hissesi Borsa İstanbul'da ${meta.sector} sektöründe işlem görmektedir. Detaylı endeks bilgisi için BIST 30, BIST 50 ve BIST 100 listelerine bakılabilir.`,
              },
              {
                q: `${meta.symbol} hissesi nasıl alınır?`,
                a: `${meta.symbol} hissesi almak için aracı kurum veya banka yatırım hesabı açmanız, ardından ilgili hisseyi BIST'te alım emriyle almanız gerekir.`,
              },
              {
                q: `${meta.name} hissesi temettü veriyor mu?`,
                a: `Temettü dağıtımı şirketin yönetim kurulu kararına bağlıdır. Güncel temettü bilgisi için KAP (Kamuyu Aydınlatma Platformu) açıklamalarını inceleyin.`,
              },
            ].map((faq, i) => (
              <details key={i} className="group rounded-lg border border-border bg-card p-4">
                <summary className="cursor-pointer font-medium list-none flex justify-between items-center">
                  {faq.q}
                  <span className="text-muted-foreground group-open:rotate-180 transition-transform">▾</span>
                </summary>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
              </details>
            ))}
          </div>
        </section>

        <FAQSchema
          faqs={[
            { q: `${meta.name} hissesi hangi endekste?`, a: `${meta.name} (${meta.symbol}) BIST'te ${meta.sector} sektöründe işlem görür.` },
            { q: `${meta.symbol} hissesi nasıl alınır?`, a: 'Aracı kurum veya banka yatırım hesabı ile BIST\'te alım emri verilir.' },
            { q: `${meta.name} temettü veriyor mu?`, a: 'Temettü dağıtımı şirket kararına bağlıdır, KAP açıklamalarını kontrol edin.' },
          ]}
        />

        {related.length > 0 && (
          <section className="mt-10">
            <h2 className="text-lg font-semibold mb-4">
              {meta.sector} Sektöründeki Diğer Hisseler
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {related.map((r) => (
                <Link
                  key={r.symbol}
                  href={`/borsa/hisseler/${r.symbol}`}
                  className="rounded-lg border border-border bg-card p-3 hover:border-primary/30 transition-colors"
                >
                  <div className="font-semibold text-sm">{r.symbol}</div>
                  <div className="text-xs text-muted-foreground truncate">{r.name}</div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <p className="mt-8 text-xs text-muted-foreground italic">
          Yatırım tavsiyesi değildir. Veriler bilgi amaçlıdır, işlem öncesi kaynak sitelerden teyit ediniz.
        </p>
      </div>
    </>
  );
}


