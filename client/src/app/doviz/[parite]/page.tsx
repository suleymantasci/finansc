import { safeJsonLd } from '@/lib/json-ld';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Banknote } from 'lucide-react';
import { SITE_NAME, SITE_URL } from '@/lib/constants';
import { CURRENCIES, CURRENCY_BY_SLUG, currencyHistoryKey } from '@/lib/instruments/currencies';
import { currencyContent } from '@/lib/instruments/currency-content';
import { PriceChart } from '@/components/charts/PriceChart';
import { AdBanner } from '@/components/ads/AdBanner';
import { DetailHeader } from '@/components/instrument/DetailHeader';
import { LiveQuote } from '@/components/instrument/LiveQuote';
import { SourceTable } from '@/components/instrument/SourceTable';
import { Converter } from '@/components/instrument/Converter';
import { RelatedQuotes } from '@/components/instrument/RelatedQuotes';
import { AboutBlock } from '@/components/instrument/AboutBlock';
import { FaqBlock } from '@/components/instrument/FaqBlock';
import { FavoriteButton } from '@/components/instrument/FavoriteButton';

interface Props {
  params: Promise<{ parite: string }>;
}

export function generateStaticParams() {
  return CURRENCIES.map((c) => ({ parite: c.slug }));
}

export const dynamicParams = false; // bilinmeyen parite → 404
export const revalidate = 60;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { parite } = await params;
  const e = CURRENCY_BY_SLUG[parite];
  if (!e) return { title: 'Döviz Bulunamadı', robots: { index: false, follow: false } };

  const title = `${e.name} Kuru Bugün (${e.code}/TRY) | Canlı ${e.code} TL`;
  const { description: long } = currencyContent(e);
  const description = long.length > 155 ? long.slice(0, 153).trimEnd() + '…' : long;
  const url = `${SITE_URL}/doviz/${e.slug}`;
  const og = `/api/og?type=doviz&title=${encodeURIComponent(`${e.code}/TRY ${e.name}`)}&subtitle=${encodeURIComponent('Döviz Kuru Bugün, Grafik ve Çevirici')}&category=DÖVİZ&url=${encodeURIComponent(`finanscozum.net/doviz/${e.slug}`)}`;

  return {
    title,
    description,
    keywords: [`${e.code} tl`, `${e.name.toLocaleLowerCase('tr-TR')} kuru`, `${e.code} try`, `${e.name.toLocaleLowerCase('tr-TR')} kaç tl`, 'döviz kuru'],
    alternates: { canonical: url },
    openGraph: { type: 'article', title, description, url, siteName: SITE_NAME, locale: 'tr_TR', images: [{ url: og, width: 1200, height: 630, alt: `${e.code}/TRY ${e.name} kuru` }] },
    twitter: { card: 'summary_large_image', title, description, images: [og] },
  };
}

export default async function CurrencyPage({ params }: Props) {
  const { parite } = await params;
  const e = CURRENCY_BY_SLUG[parite];
  if (!e) notFound();

  const { description, faq, related } = currencyContent(e);
  const canonical = `${SITE_URL}/doviz/${e.slug}`;
  const historyKey = currencyHistoryKey(e);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'ExchangeRateSpecification',
        currency: e.code,
        name: `${e.code}/TRY`,
        url: canonical,
        currentExchangeRate: { '@type': 'UnitPriceSpecification', priceCurrency: 'TRY', referenceQuantity: { '@type': 'QuantitativeValue', value: 1, unitText: e.code } },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Ana Sayfa', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'Döviz', item: `${SITE_URL}/doviz` },
          { '@type': 'ListItem', position: 3, name: `${e.code}/TRY`, item: canonical },
        ],
      },
      {
        '@type': 'WebPage',
        '@id': canonical,
        url: canonical,
        name: `${e.name} Kuru`,
        inLanguage: 'tr-TR',
        isPartOf: { '@type': 'WebSite', name: SITE_NAME, url: SITE_URL },
        speakable: { '@type': 'SpeakableSpecification', cssSelector: ['h1', '#fx-about'] },
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />

      <DetailHeader
        category="doviz"
        crumbs={[{ label: 'Ana Sayfa', href: '/' }, { label: 'Döviz', href: '/doviz' }, { label: `${e.code}/TRY` }]}
        eyebrow={`Döviz · ${e.code}/TRY`}
        title={`${e.name} kuru`}
        subtitle={<>{e.country} · serbest piyasa{e.tcmbName ? ' ve TCMB' : ''} kuru, geçmiş grafik ve çevirici.</>}
        emblem={<span className="num text-lg font-semibold">{e.code}</span>}
        tagline="Kur hareketleri, fiyatların görünmeyen dilidir."
        actions={<FavoriteButton type="currency" symbol={e.code} label={`${e.name} kuru`} />}
      />

      <div className="mx-auto grid max-w-[1440px] gap-6 px-4 py-8 pb-24 lg:grid-cols-[minmax(0,1fr)_380px] lg:px-8 md:pb-12">
        <div className="min-w-0 space-y-6">
          <section aria-label={`${e.name} anlık kur`}>
            <LiveQuote spec={{ kind: 'fx', code: e.code }} label={`${e.code}/TRY`} />
          </section>

          {historyKey ? (
            <PriceChart instrument={historyKey} defaultRange="1y" decimals={4} scale={e.historyUnit} />
          ) : (
            <p className="atlas-card p-5 text-sm text-muted-foreground">Bu para birimi için geçmiş grafik verisi bulunmuyor.</p>
          )}

          <SourceTable kind="fx" id={e.code} />

          <AdBanner page={`doviz-${e.slug}`} position="in-article" />

          <AboutBlock
            id="fx-about"
            title={`${e.name} (${e.code}) nedir?`}
            facts={[
              { label: 'ISO kodu', value: e.code },
              { label: 'Ülke / bölge', value: e.country },
              { label: 'Kaynaklar', value: [e.serbestName && 'Serbest piyasa', e.tcmbName && 'TCMB'].filter(Boolean).join(', ') },
              { label: 'Kotasyon', value: `1 ${e.code} = ? ₺` },
            ]}
          >
            <p>{description}</p>
          </AboutBlock>

          <FaqBlock title={`${e.name} kuru hakkında sık sorulanlar`} faqs={faq} />
        </div>

        <aside className="space-y-6">
          <Converter title={`${e.code} çevirici`} unitLabel={e.code} moneyLabel="Türk lirası" spec={{ kind: 'fx', code: e.code }} decimals={2} />
          <RelatedQuotes
            title="İlgili kurlar"
            moreHref="/doviz"
            moreLabel="Tüm kurlar"
            items={related.map((r) => ({ label: r.name, sub: `${r.code}/TRY`, href: `/doviz/${r.slug}`, spec: { kind: 'fx' as const, code: r.code } }))}
          />
        </aside>
      </div>

      <p className="mx-auto max-w-[1440px] px-4 pb-10 text-xs text-muted-foreground lg:px-8">
        Yatırım tavsiyesi değildir. Kurlar bilgi amaçlıdır; işlem öncesi bankanızdan teyit ediniz.
      </p>
    </>
  );
}
