import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SITE_NAME, SITE_URL } from '@/lib/constants';
import { STOCK_META, getStockMeta, type StockMeta } from '@/lib/seo-data/stocks';
import {
  isKnownStockSymbol,
  getKnownStockSymbols,
} from '@/lib/seo-data/whitelist';
import { instrumentKey } from '@/lib/history';
import { DetailHeader } from '@/components/instrument/DetailHeader';
import { LiveQuote } from '@/components/instrument/LiveQuote';
import { Converter } from '@/components/instrument/Converter';
import { RelatedQuotes } from '@/components/instrument/RelatedQuotes';
import { AboutBlock } from '@/components/instrument/AboutBlock';
import { FaqBlock } from '@/components/instrument/FaqBlock';
import { FavoriteButton } from '@/components/instrument/FavoriteButton';
import { PriceChart } from '@/components/charts/PriceChart';
import { AdBanner } from '@/components/ads/AdBanner';
import { DataDisclaimer } from '@/components/shared/DataDisclaimer';

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
      images: [
        {
          url: `/api/og?type=hisse&title=${encodeURIComponent(`${meta.name} (${meta.symbol})`)}&subtitle=${encodeURIComponent('Hisse Senedi Fiyatı, Grafik ve Analiz')}&category=BORSA&url=${encodeURIComponent(`finanscozum.net/borsa/hisseler/${meta.symbol}`)}`,
          width: 1200,
          height: 630,
          alt: `${meta.name} (${meta.symbol}) Hisse Senedi — Fiyat, Grafik ve Yorum`,
          type: 'image/png',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`/api/og?type=hisse&title=${encodeURIComponent(`${meta.name} (${meta.symbol})`)}&subtitle=${encodeURIComponent('Hisse Senedi Fiyatı, Grafik ve Analiz')}&category=BORSA&url=${encodeURIComponent(`finanscozum.net/borsa/hisseler/${meta.symbol}`)}`],
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
          cssSelector: ['h1', '#stock-about'],
        },
      },
    ],
  };

  const related = (meta.relatedSlugs ?? []).filter((r) => r !== meta.symbol).slice(0, 6);
  const hasName = meta.name !== meta.symbol;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <DetailHeader
        category="borsa"
        crumbs={[
          { label: 'Ana Sayfa', href: '/' },
          { label: 'Borsa', href: '/borsa' },
          { label: 'Hisseler', href: '/borsa/hisseler' },
          { label: meta.symbol },
        ]}
        eyebrow={`Borsa İstanbul · ${meta.sector}`}
        title={hasName ? `${meta.name} (${meta.symbol})` : `${meta.symbol} hisse senedi`}
        subtitle={<>Güncel {meta.symbol} hisse fiyatı, gün içi aralık, işlem hacmi ve geçmiş grafik.</>}
        emblem={<span className="num text-base font-semibold">{meta.symbol.slice(0, 4)}</span>}
        tagline="Piyasalar hareket eder, siz önde kalın."
        actions={<FavoriteButton type="stock" symbol={meta.symbol} label={`${meta.symbol} hissesi`} />}
      />

      <div className="mx-auto grid max-w-[1440px] gap-6 px-4 py-8 pb-24 lg:grid-cols-[minmax(0,1fr)_380px] lg:px-8 md:pb-12">
        <div className="min-w-0 space-y-6">
          <section aria-label={`${meta.symbol} anlık fiyat`}>
            <LiveQuote spec={{ kind: 'stock', symbol: meta.symbol }} label={`${meta.symbol} hissesi`} />
          </section>

          <PriceChart instrument={instrumentKey.stock(meta.symbol)} defaultRange="1y" height={360} />

          <AdBanner page={`hisse-${meta.symbol}`} position="in-article" />

          <AboutBlock
            id="stock-about"
            title={hasName ? `${meta.name} hakkında` : `${meta.symbol} hakkında`}
            facts={[
              { label: 'Sembol', value: meta.symbol },
              { label: 'Sektör', value: meta.sector },
              { label: 'Borsa', value: 'Borsa İstanbul (BIST)' },
              { label: 'Veri', value: '15 dk gecikmeli' },
            ]}
          >
            <p>{meta.description}</p>
          </AboutBlock>

          <FaqBlock title={`${meta.symbol} hakkında sık sorulanlar`} faqs={meta.faq ?? []} />
          <DataDisclaimer variant="borsa" />
        </div>

        <aside className="space-y-6">
          <Converter title={`${meta.symbol} hesaplayıcı`} unitLabel="Lot (adet)" moneyLabel="Türk lirası" spec={{ kind: 'stock', symbol: meta.symbol }} />
          <RelatedQuotes
            title="İlgili hisseler"
            moreHref="/borsa/hisseler"
            moreLabel="Tüm hisseler"
            items={related.map((r) => ({ label: r, sub: STOCK_META[r]?.name, href: `/borsa/hisseler/${r}`, spec: { kind: 'stock' as const, symbol: r } }))}
          />
          <RelatedQuotes
            title="Endeksler"
            moreHref="/borsa/endeksler"
            moreLabel="Tüm endeksler"
            items={['XU100', 'XU030', 'XBANK'].map((x) => ({ label: x === 'XU100' ? 'BIST 100' : x === 'XU030' ? 'BIST 30' : 'BIST Banka', sub: x, href: `/borsa/endeksler/${x}`, spec: { kind: 'index' as const, symbol: x } }))}
          />
        </aside>
      </div>
    </>
  );
}
