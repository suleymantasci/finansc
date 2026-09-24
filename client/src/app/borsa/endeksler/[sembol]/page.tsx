import { safeJsonLd } from '@/lib/json-ld';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SITE_NAME, SITE_URL } from '@/lib/constants';
import { INDEX_META, INDEX_SYMBOLS, getIndexMeta, type IndexMeta } from '@/lib/seo-data/indices';
import { STOCK_META } from '@/lib/seo-data/stocks';
import { getKnownIndexSymbols, isKnownIndexSymbol } from '@/lib/seo-data/whitelist';
import { instrumentKey } from '@/lib/history';
import { CandlestickChart } from 'lucide-react';
import { PriceChart } from '@/components/charts/PriceChart';
import { AdBanner } from '@/components/ads/AdBanner';
import { DataDisclaimer } from '@/components/shared/DataDisclaimer';
import { DetailHeader } from '@/components/instrument/DetailHeader';
import { LiveQuote } from '@/components/instrument/LiveQuote';
import { RelatedQuotes } from '@/components/instrument/RelatedQuotes';
import { AboutBlock } from '@/components/instrument/AboutBlock';
import { FaqBlock } from '@/components/instrument/FaqBlock';
import { FavoriteButton } from '@/components/instrument/FavoriteButton';

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
    description: `${symbol}, Borsa İstanbul (BIST) tarafından hesaplanan endekslerden biridir. Bu sayfada ${symbol} endeksinin güncel değeri, günlük değişim yüzdesi, gün içi en yüksek ve en düşük seviyeleri ile geçmiş grafiği yer alır. Veriler 15 dakika gecikmelidir.`,
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
        a: `${symbol} endeksinin yükselmesi, endeksteki hisselerin ağırlıklı ortalamada değer kazandığını gösterir. Endeksi takip eden fonların performansı da genellikle aynı yönde hareket eder.`,
      },
    ],
    relatedSymbols: related,
  };
}

export async function generateStaticParams() {
  const live = await getKnownIndexSymbols();
  return [...new Set([...INDEX_SYMBOLS, ...live])].map((sembol) => ({ sembol }));
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
  if (!isValidIndexFormat(sembol) || !(await isKnownIndexSymbol(sembol))) {
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
      locale: 'tr_TR',
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
  if (!isValidIndexFormat(sembol) || !(await isKnownIndexSymbol(sembol))) notFound();
  const meta = isKnownIndex(sembol) ? getIndexMeta(sembol) : getFallbackMeta(sembol);
  const canonical = `${SITE_URL}/borsa/endeksler/${meta.symbol}`;
  const known = isKnownIndex(sembol);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'FinancialProduct',
        name: meta.fullName,
        alternateName: meta.symbol,
        category: 'Borsa endeksi',
        description: meta.description,
        url: canonical,
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
        name: `${meta.name} (${meta.symbol})`,
        inLanguage: 'tr-TR',
        isPartOf: { '@type': 'WebSite', name: SITE_NAME, url: SITE_URL },
        speakable: { '@type': 'SpeakableSpecification', cssSelector: ['h1', '#index-about'] },
      },
    ],
  };

  const related = (meta.relatedSymbols ?? []).filter((r) => r !== meta.symbol).slice(0, 6);
  const companies = meta.companies ?? [];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />

      <DetailHeader
        category="borsa"
        crumbs={[
          { label: 'Ana Sayfa', href: '/' },
          { label: 'Borsa', href: '/borsa' },
          { label: 'Endeksler', href: '/borsa?tab=endeksler' },
          { label: meta.symbol },
        ]}
        eyebrow="Borsa İstanbul · Endeks"
        title={known ? `${meta.name} (${meta.symbol})` : `${meta.symbol} endeksi`}
        subtitle={known ? meta.fullName : 'Borsa İstanbul endeksi · güncel değer ve geçmiş grafik'}
        emblem={<CandlestickChart className="h-7 w-7" />}
        actions={<FavoriteButton type="index" symbol={meta.symbol} label={`${meta.symbol} endeksi`} />}
      />

      <div className="mx-auto grid max-w-[1440px] gap-6 px-4 py-8 pb-24 lg:grid-cols-[minmax(0,1fr)_380px] lg:px-8 md:pb-12">
        <div className="min-w-0 space-y-6">
          <section aria-label={`${meta.symbol} anlık değer`}>
            <LiveQuote spec={{ kind: 'index', symbol: meta.symbol }} label={`${meta.symbol} endeksi`} />
          </section>

          <PriceChart instrument={instrumentKey.index(meta.symbol)} defaultRange="1y" height={360} />

          <AdBanner page={`endeks-${meta.symbol}`} position="in-article" />

          <AboutBlock
            id="index-about"
            title={`${meta.name} nedir?`}
            facts={[
              { label: 'Sembol', value: meta.symbol },
              { label: 'Borsa', value: 'Borsa İstanbul' },
              { label: 'Veri', value: '15 dk gecikmeli' },
              { label: 'Birim', value: 'Puan' },
            ]}
          >
            <p>{meta.description}</p>
            {companies.length > 0 && (
              <p className="mt-3">
                Endeksin başlıca bileşenleri arasında {companies.slice(0, 8).join(', ')} yer alır.
              </p>
            )}
          </AboutBlock>

          <FaqBlock title={`${meta.name} hakkında sık sorulanlar`} faqs={meta.faq ?? []} />
          <DataDisclaimer variant="borsa" />
        </div>

        <aside className="space-y-6">
          <RelatedQuotes
            title="İlgili endeksler"
            moreHref="/borsa?tab=endeksler"
            moreLabel="Tüm endeksler"
            items={related.map((r) => ({ label: INDEX_META[r]?.name ?? r, sub: r, href: `/borsa/endeksler/${r}`, spec: { kind: 'index' as const, symbol: r } }))}
          />
          <RelatedQuotes
            title="Öne çıkan hisseler"
            moreHref="/borsa?tab=hisseler"
            moreLabel="Tüm hisseler"
            items={['THYAO', 'GARAN', 'AKBNK', 'ASELS', 'TUPRS', 'BIMAS'].map((x) => ({ label: x, sub: STOCK_META[x]?.name, href: `/borsa/hisseler/${x}`, spec: { kind: 'stock' as const, symbol: x } }))}
          />
        </aside>
      </div>
    </>
  );
}
