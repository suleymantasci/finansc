import { safeJsonLd } from '@/lib/json-ld';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Fuel, Gem, Factory, Wheat } from 'lucide-react';
import { SITE_NAME, SITE_URL } from '@/lib/constants';
import { COMMODITIES, COMMODITY_BY_SLUG, COMMODITY_GROUP_LABELS, type CommodityGroup } from '@/lib/instruments/commodities';
import { fetchCommoditySnapshot, formatCommodity, formatDateTr } from '@/lib/instruments/commodity-data';
import { pctTr } from '@/lib/formatters';
import { PriceChart } from '@/components/charts/PriceChart';
import { AdBanner } from '@/components/ads/AdBanner';
import { DetailHeader } from '@/components/instrument/DetailHeader';
import { Converter } from '@/components/instrument/Converter';
import { RelatedQuotes } from '@/components/instrument/RelatedQuotes';
import { AboutBlock } from '@/components/instrument/AboutBlock';
import { FaqBlock } from '@/components/instrument/FaqBlock';
import { FavoriteButton } from '@/components/instrument/FavoriteButton';
import { cn } from '@/lib/utils';

interface Props {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return COMMODITIES.map((c) => ({ slug: c.slug }));
}

export const dynamicParams = false;
export const revalidate = 600;

const GROUP_ICON: Record<CommodityGroup, typeof Fuel> = {
  enerji: Fuel,
  'degerli-metal': Gem,
  'endustriyel-metal': Factory,
  tarim: Wheat,
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const e = COMMODITY_BY_SLUG[slug];
  if (!e) return { title: 'Emtia Bulunamadı', robots: { index: false, follow: false } };
  const title = `${e.name} Fiyatı Bugün (${e.unit}) | Grafik ve Geçmiş`;
  const description = e.description.length > 155 ? e.description.slice(0, 153).trimEnd() + '…' : e.description;
  const url = `${SITE_URL}/emtia/${e.slug}`;
  const og = `/api/og?type=emtia&title=${encodeURIComponent(e.name)}&subtitle=${encodeURIComponent(`${e.unit} · Fiyat ve Grafik`)}&category=EMTİA&url=${encodeURIComponent(`finanscozum.net/emtia/${e.slug}`)}`;
  return {
    title,
    description,
    keywords: [`${e.name.toLocaleLowerCase('tr-TR')} fiyatı`, `${e.shortName.toLocaleLowerCase('tr-TR')} ne kadar`, 'emtia fiyatları', `${e.name.toLocaleLowerCase('tr-TR')} grafik`],
    alternates: { canonical: url },
    openGraph: { type: 'article', title, description, url, siteName: SITE_NAME, locale: 'tr_TR', images: [{ url: og, width: 1200, height: 630, alt: `${e.name} fiyatı` }] },
    twitter: { card: 'summary_large_image', title, description, images: [og] },
  };
}

export default async function CommodityPage({ params }: Props) {
  const { slug } = await params;
  const e = COMMODITY_BY_SLUG[slug];
  if (!e) notFound();

  const peers = COMMODITIES.filter((c) => c.group === e.group && c.slug !== e.slug);
  const [snap, ...peerSnaps] = await Promise.all([fetchCommoditySnapshot(e), ...peers.map((p) => fetchCommoditySnapshot(p))]);
  const canonical = `${SITE_URL}/emtia/${e.slug}`;
  const Icon = GROUP_ICON[e.group];
  const ch = snap?.changePct ?? 0;
  const money = e.currency === 'TRY' ? 'Türk lirası' : e.currency === 'USX' ? 'ABD senti' : 'ABD doları';
  const unitOnly = e.unit.split('/')[1] ?? 'birim';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Product',
        name: e.name,
        category: COMMODITY_GROUP_LABELS[e.group],
        description: e.description,
        url: canonical,
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Ana Sayfa', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'Emtia', item: `${SITE_URL}/emtia` },
          { '@type': 'ListItem', position: 3, name: e.name, item: canonical },
        ],
      },
      {
        '@type': 'WebPage',
        '@id': canonical,
        url: canonical,
        name: `${e.name} fiyatı`,
        inLanguage: 'tr-TR',
        dateModified: snap?.date,
        isPartOf: { '@type': 'WebSite', name: SITE_NAME, url: SITE_URL },
        speakable: { '@type': 'SpeakableSpecification', cssSelector: ['h1', '#commodity-summary', '#commodity-about'] },
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />

      <DetailHeader
        category="emtia"
        crumbs={[{ label: 'Ana Sayfa', href: '/' }, { label: 'Emtia', href: '/emtia' }, { label: e.name }]}
        eyebrow={`Emtia · ${COMMODITY_GROUP_LABELS[e.group]}`}
        title={e.name}
        subtitle={<>Fiyat birimi: {e.unit} · son kapanış, günlük değişim ve geçmiş grafik.</>}
        emblem={<Icon className="h-7 w-7" />}
        tagline="Hammaddeler, ekonominin nabzını tutar."
        actions={<FavoriteButton type="commodity" symbol={e.slug} label={e.name} />}
      />

      <div className="mx-auto grid max-w-[1440px] gap-6 px-4 py-8 pb-24 lg:grid-cols-[minmax(0,1fr)_380px] lg:px-8 md:pb-12">
        <div className="min-w-0 space-y-6">
          <section aria-label={`${e.name} son fiyat`}>
            {snap ? (
              <>
                <div className="flex flex-wrap items-end gap-x-5 gap-y-2">
                  <p className="num text-5xl font-medium leading-none tracking-tight text-foreground sm:text-6xl">
                    {formatCommodity(e, snap.last)}
                    <span className="ml-2 text-xl text-muted-foreground">{e.unit}</span>
                  </p>
                  {snap.changePct != null && (
                    <p className={cn('num flex items-center gap-1.5 pb-1 text-lg font-medium', ch > 0 && 'text-up', ch < 0 && 'text-down', ch === 0 && 'text-neutral')}>
                      <span aria-hidden="true">{ch > 0 ? '▲' : ch < 0 ? '▼' : '•'}</span>
                      {pctTr(ch, { signed: true })}
                      <span className="text-[12px] font-normal text-muted-foreground">önceki kapanışa göre</span>
                    </p>
                  )}
                </div>
                <dl className="mt-5 flex flex-wrap gap-x-8 gap-y-3">
                  {snap.prev != null && (
                    <div>
                      <dt className="text-[12px] text-muted-foreground">Önceki kapanış</dt>
                      <dd className="num mt-0.5 text-[15px] text-foreground">{formatCommodity(e, snap.prev)}</dd>
                    </div>
                  )}
                  {snap.low != null && snap.high != null && snap.low !== snap.high && (
                    <>
                      <div>
                        <dt className="text-[12px] text-muted-foreground">Gün düşük</dt>
                        <dd className="num mt-0.5 text-[15px] text-foreground">{formatCommodity(e, snap.low)}</dd>
                      </div>
                      <div>
                        <dt className="text-[12px] text-muted-foreground">Gün yüksek</dt>
                        <dd className="num mt-0.5 text-[15px] text-foreground">{formatCommodity(e, snap.high)}</dd>
                      </div>
                    </>
                  )}
                </dl>
                <p id="commodity-summary" className="mt-4 text-[12px] text-muted-foreground">
                  {e.name}, {formatDateTr(snap.date)} tarihli son günlük kapanışta {formatCommodity(e, snap.last)} {e.unit} seviyesindedir. Emtia verileri günlük kapanış bazındadır, canlı değildir.
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Şu anda {e.name} için fiyat verisi alınamıyor.</p>
            )}
          </section>

          <PriceChart instrument={e.historyKey} defaultRange="1y" decimals={e.decimals} live={false} />

          <AdBanner page={`emtia-${e.slug}`} position="in-article" />

          <AboutBlock
            id="commodity-about"
            title={`${e.name} nedir?`}
            facts={[
              { label: 'Grup', value: COMMODITY_GROUP_LABELS[e.group] },
              { label: 'Fiyat birimi', value: e.unit },
              { label: 'Veri sıklığı', value: 'Günlük kapanış' },
              { label: 'Kaynak', value: e.historyKey.startsWith('gold:') ? 'Serbest piyasa' : 'Uluslararası vadeli piyasalar' },
            ]}
          >
            <p>{e.description}</p>
          </AboutBlock>

          <FaqBlock title={`${e.name} hakkında sık sorulanlar`} faqs={e.faq} />
        </div>

        <aside className="space-y-6">
          {snap && e.unit !== 'oran' && (
            <Converter title={`${e.shortName} hesaplayıcı`} unitLabel={unitOnly.charAt(0).toLocaleUpperCase('tr-TR') + unitOnly.slice(1)} moneyLabel={money} price={snap.last} decimals={e.decimals} />
          )}
          <RelatedQuotes
            title={COMMODITY_GROUP_LABELS[e.group]}
            moreHref="/emtia"
            moreLabel="Tüm emtialar"
            items={peers.map((p, i) => ({
              label: p.name,
              sub: p.unit,
              href: `/emtia/${p.slug}`,
              staticPrice: peerSnaps[i] ? { value: formatCommodity(p, peerSnaps[i]!.last), change: peerSnaps[i]!.changePct } : undefined,
            }))}
          />
        </aside>
      </div>
    </>
  );
}
