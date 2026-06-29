import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SITE_NAME, SITE_URL } from '@/lib/constants';
import { INDEX_META, INDEX_SYMBOLS, getIndexMeta, type IndexMeta } from '@/lib/seo-data/indices';
import { LiveIndexTicker } from './LiveIndexTicker';
import { AdBanner } from '@/components/ads/AdBanner';
import { FAQSchema } from '@/components/seo/FAQSchema';
import { DataDisclaimer } from '@/components/shared/DataDisclaimer';
import Link from 'next/link';

interface Props {
  params: Promise<{ sembol: string }>;
}

// Endeks sembol format doğrulaması — gevşek tut, fallback için yeterli.
function isValidIndexFormat(symbol: string): boolean {
  return /^[A-Z][A-Z0-9]{2,6}$/.test(symbol);
}

function isKnownIndex(symbol: string): boolean {
  return symbol in INDEX_META;
}

// INDEX_META'da olmayan endeksler için generic fallback meta üret.
// API'den dönen 600+ hisse/çok sayıda endeks için elle meta yazılamaz.
// Fallback BIST bağlamlı, sembolün gerçek adını gösteren, related-symbols
// zengin içerik sağlar.
function getFallbackMeta(symbol: string): IndexMeta {
  const related = Object.keys(INDEX_META).slice(0, 6);
  return {
    symbol,
    name: symbol,
    fullName: `${symbol} Borsa İstanbul Endeksi`,
    description: `${symbol} Borsa İstanbul'da (BIST) işlem gören endekslerden biridir. ${symbol} endeksi için güncel değer, günlük değişim yüzdesi, hacim ve gün içi en yüksek/düşük seviyeler bu sayfada anlık olarak güncellenmektedir. Endeksin bileşimi, içerdiği şirketler ve geçmiş performansına bu sayfadan ulaşabilirsiniz.`,
    faq: [
      {
        q: `${symbol} nedir?`,
        a: `${symbol} Borsa İstanbul'da işlem gören bir pay endeksidir. BIST çatısı altında gruplanan endeksler belirli kriterlere göre (sektör, büyüklük, temettü vb.) oluşturulur ve yatırımcılara farklı stratejiler sunar.`,
      },
      {
        q: `${symbol} nasıl hesaplanır?`,
        a: `${symbol} bileşim ve ağırlıklandırma yöntemine göre hesaplanır. Çoğu BIST endeksi sermaye ağırlıklı (piyasa değerine göre) hesaplanır ve belirli periyotlarla yeniden bileşen güncellemesi yapılır.`,
      },
      {
        q: `${symbol} yükselirse ne olur?`,
        a: `${symbol} yükselmesi, endeksteki hisselerin genel olarak değer kazandığını gösterir. Yatırımcı güveni artar, endeksi takip eden fon/ETF performansı olumlu etkilenir.`,
      },
    ],
    relatedSymbols: related,
  };
}

export function generateStaticParams() {
  return INDEX_SYMBOLS.map((sembol) => ({ sembol }));
}

// dynamicParams=true: whitelist'te olmayan endeksler için runtime'da
// sayfa üret → generateMetadata/Page çalışır, whitelist kontrolü orada yapılır.
// (Hisseler sayfasındaki gibi — bilinen + bilinmeyen tüm semboller).
// Pit 29 trade-off: thin content riski az çünkü fallback BIST bağlamlı,
// sektörel ve unique içerik üretir.
export const dynamicParams = true;
export const revalidate = 60;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { sembol } = await params;
  if (!isValidIndexFormat(sembol)) {
    return { title: 'Endeks Bulunamadı', robots: { index: false, follow: false } };
  }
  const meta = isKnownIndex(sembol) ? getIndexMeta(sembol) : getFallbackMeta(sembol);
  const title = `${meta.name} (${meta.symbol})`;
  const description = (meta.description.length > 155
    ? meta.description.slice(0, 153).trimEnd() + '…'
    : meta.description);
  return {
    title,
    description,
    keywords: [
      `${meta.symbol} endeks`,
      `${meta.name} bugün`,
      `bist ${meta.symbol.toLowerCase()}`,
      `${meta.symbol} güncel`,
      'bist endeks',
      'borsa istanbul',
    ],
    alternates: { canonical: `${SITE_URL}/borsa/endeksler/${meta.symbol}` },
    openGraph: {
      type: 'article',
      title,
      description,
      url: `${SITE_URL}/borsa/endeksler/${meta.symbol}`,
      siteName: SITE_NAME,
      locale: 'tr-TR',
      images: [
        {
          url: `/api/og?type=endeks&title=${encodeURIComponent(`${meta.name} (${meta.symbol})`)}&subtitle=${encodeURIComponent('Borsa Endeksi Bugün, Grafik ve Analiz')}&category=BORSA&url=${encodeURIComponent(`finanscozum.net/borsa/endeksler/${meta.symbol}`)}`,
          width: 1200,
          height: 630,
          alt: `${meta.name} (${meta.symbol}) Borsa Endeksi — Anlık Veri ve Yorum`,
          type: 'image/png',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`/api/og?type=endeks&title=${encodeURIComponent(`${meta.name} (${meta.symbol})`)}&subtitle=${encodeURIComponent('Borsa Endeksi Bugün, Grafik ve Analiz')}&category=BORSA&url=${encodeURIComponent(`finanscozum.net/borsa/endeksler/${meta.symbol}`)}`],
    },
  };
}

export default async function IndexPage({ params }: Props) {
  const { sembol } = await params;
  if (!isValidIndexFormat(sembol)) notFound();
  const meta = isKnownIndex(sembol) ? getIndexMeta(sembol) : getFallbackMeta(sembol);
  const canonical = `${SITE_URL}/borsa/endeksler/${meta.symbol}`;
  const pageTitle = `${meta.name} (${meta.symbol}) Endeksi`;

  // JSON-LD schema (GEO-friendly)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'FinancialProduct',
        name: meta.fullName,
        alternateName: meta.name,
        category: 'Borsa Endeksi',
        identifier: meta.symbol,
        url: canonical,
        description: meta.description,
        provider: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Ana Sayfa', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'Borsa', item: `${SITE_URL}/borsa` },
          { '@type': 'ListItem', position: 3, name: 'Endeksler', item: `${SITE_URL}/borsa?tab=endeksler` },
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
          cssSelector: ['#index-summary', 'h1'],
        },
      },
    ],
  };

  // Citable snippet (GEO için)
  const summary = `${meta.name} (${meta.symbol}) endeksi Borsa İstanbul'da ${meta.companies ? `aralarında ${meta.companies.slice(0, 3).join(', ')} gibi büyük şirketlerin yer aldığı` : 'işlem gören'} bir endekstir. Güncel endeks değeri, günlük değişim, en yüksek/düşük seviyeler yukarıda anlık olarak güncellenmektedir.`;

  // Fallback meta'da companies yok → INDEX_META'dan çekilen related'lerden
  // uydurma related'ler kullan; bilinen meta'da kendi relatedSymbols'i var.
  const related = isKnownIndex(sembol)
    ? meta.relatedSymbols.map((s) => INDEX_META[s]).filter(Boolean)
    : (meta.relatedSymbols || []).map((s) => INDEX_META[s]).filter(Boolean);

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
            <li>
              <Link href="/borsa?tab=endeksler" className="hover:text-primary">Endeksler</Link>
            </li>
            <li aria-hidden>/</li>
            <li className="text-foreground font-medium">{meta.name}</li>
          </ol>
        </nav>

        <DataDisclaimer variant="borsa" />

        <header className="mb-6">
          <h1 className="text-2xl lg:text-3xl font-bold">
            {meta.name} ({meta.symbol}) Endeksi
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {meta.fullName}
          </p>
        </header>

        {/* Citable snippet */}
        <p
          id="index-summary"
          className="mb-6 rounded-lg border-l-4 border-primary bg-primary/5 p-4 text-sm leading-relaxed"
        >
          {summary}
        </p>

        <LiveIndexTicker symbol={meta.symbol} />

        <AdBanner page={`borsa-endeks-${meta.symbol}`} position="in-article" className="my-8" />

        <section className="prose prose-slate dark:prose-invert max-w-none mt-8">
          <h2 className="text-xl font-semibold mb-3">{meta.name} Nedir?</h2>
          <p className="text-muted-foreground leading-relaxed">{meta.description}</p>

          {meta.companies && meta.companies.length > 0 && (
            <>
              <h3 className="text-lg font-semibold mt-6 mb-3">{meta.name} İçindeki Önemli Şirketler</h3>
              <ul>
                {meta.companies.map((c) => (
                  <li key={c}><strong>{c}</strong> — BIST endeksinde yer alan önemli şirketlerden biridir.</li>
                ))}
              </ul>
            </>
          )}

          <h3 className="text-lg font-semibold mt-6 mb-3">Sıkça Sorulan Sorular</h3>
          <FAQSchema faqs={meta.faq} />

          {related.length > 0 && (
            <>
              <h3 className="text-lg font-semibold mt-6 mb-3">İlgili Endeksler</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 not-prose">
                {related.map((r) => (
                  <Link
                    key={r.symbol}
                    href={`/borsa/endeksler/${r.symbol}`}
                    className="rounded-lg border border-border bg-card p-3 hover:border-primary/30 transition-colors"
                  >
                    <div className="font-semibold text-sm">{r.name} ({r.symbol})</div>
                    <div className="text-xs text-muted-foreground truncate">{r.fullName}</div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </section>

        <AdBanner page={`borsa-endeks-${meta.symbol}`} position="footer" className="mt-8" />

        <div className="mt-8 flex justify-end">
          <Link href="/borsa" className="text-sm text-primary hover:underline">← Borsa Ana Sayfası</Link>
        </div>
      </div>
    </>
  );
}
