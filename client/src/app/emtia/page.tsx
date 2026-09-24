import { safeJsonLd } from '@/lib/json-ld';
import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE_NAME, SITE_URL } from '@/lib/constants';
import { COMMODITIES, COMMODITY_GROUP_LABELS, type CommodityGroup } from '@/lib/instruments/commodities';
import { fetchCommoditySnapshot, formatCommodity, formatDateTr } from '@/lib/instruments/commodity-data';
import { pctTr } from '@/lib/formatters';
import { SectionIntro } from '@/components/shared/SectionIntro';
import { Breadcrumb } from '@/components/shared/Breadcrumb';
import { FaqBlock } from '@/components/instrument/FaqBlock';
import { cn } from '@/lib/utils';

export const revalidate = 600;

export const metadata: Metadata = {
  title: 'Emtia Fiyatları Bugün | Petrol, Gümüş, Bakır, Buğday',
  description:
    'Brent petrol, WTI, doğalgaz, gümüş, platin, bakır, buğday, kahve ve kakao dahil 16 emtianın son kapanış fiyatı, günlük değişimi ve geçmiş grafiği.',
  alternates: { canonical: `${SITE_URL}/emtia` },
  openGraph: {
    title: 'Emtia Fiyatları Bugün',
    description: 'Enerji, değerli metal, endüstriyel metal ve tarım emtialarının güncel fiyatları ve grafikleri.',
    url: `${SITE_URL}/emtia`,
    siteName: SITE_NAME,
    locale: 'tr_TR',
    type: 'website',
    images: [{ url: `/api/og?type=emtia&title=${encodeURIComponent('Emtia Fiyatları')}&subtitle=${encodeURIComponent('Petrol, metaller ve tarım ürünleri')}&category=EMTİA`, width: 1200, height: 630 }],
  },
};

const GROUP_ORDER: CommodityGroup[] = ['enerji', 'degerli-metal', 'endustriyel-metal', 'tarim'];

const FAQS = [
  {
    q: 'Emtia fiyatları ne sıklıkla güncellenir?',
    a: 'Bu sayfadaki emtia fiyatları günlük kapanış verileridir; her satırda verinin tarihi gösterilir. Gün içi anlık fiyat değildir.',
  },
  {
    q: 'Emtia fiyatları hangi birimle gösterilir?',
    a: 'Her emtia kendi uluslararası kotasyon birimiyle gösterilir: petrol varil başına ABD doları, değerli metaller ons başına ABD doları, tahıllar buşel başına ABD senti, kahve ve şeker libre başına ABD senti gibi.',
  },
  {
    q: 'Gram altın ve gram gümüş fiyatlarını nerede bulabilirim?',
    a: 'Türk lirası cinsinden gram altın, çeyrek altın ve gram gümüş fiyatları Altın bölümünde anlık olarak yer alır.',
  },
];

export default async function EmtiaPage() {
  const snaps = await Promise.all(COMMODITIES.map((c) => fetchCommoditySnapshot(c)));
  const rows = COMMODITIES.map((c, i) => ({ c, s: snaps[i] }));

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Emtia fiyatları',
    itemListElement: COMMODITIES.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, url: `${SITE_URL}/emtia/${c.slug}` })),
  };

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-8 pb-24 lg:px-8 md:pb-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
      <Breadcrumb items={[{ label: 'Ana Sayfa', href: '/' }, { label: 'Emtia' }]} />
      <SectionIntro
        eyebrow="Emtia"
        title="Emtia fiyatları"
        description="Enerji, değerli metal, endüstriyel metal ve tarım ürünlerinin son kapanış fiyatları. Her birinin geçmiş grafiği ve açıklaması kendi sayfasında."
      />

      <div className="space-y-10">
        {GROUP_ORDER.map((g) => {
          const list = rows.filter((r) => r.c.group === g);
          return (
            <section key={g} aria-labelledby={`g-${g}`}>
              <h2 id={`g-${g}`} className="font-display mb-4 text-2xl text-foreground">
                {COMMODITY_GROUP_LABELS[g]}
              </h2>
              <div className="atlas-card overflow-x-auto md:overflow-visible">
                <table className="w-full min-w-[560px] text-sm">
                  <thead className="sticky-thead">
                    <tr className="border-b border-border text-left text-[12px] text-muted-foreground">
                      <th scope="col" className="px-5 py-3 font-normal">Emtia</th>
                      <th scope="col" className="px-3 py-3 text-right font-normal">Son kapanış</th>
                      <th scope="col" className="px-3 py-3 font-normal">Birim</th>
                      <th scope="col" className="px-3 py-3 text-right font-normal">Değişim</th>
                      <th scope="col" className="px-5 py-3 text-right font-normal">Tarih</th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.map(({ c, s }) => {
                      const ch = s?.changePct ?? 0;
                      return (
                        <tr key={c.slug} className="border-b border-border/60 last:border-0 transition-colors hover:bg-surface-hover">
                          <th scope="row" className="px-5 py-3 text-left font-normal">
                            <Link href={`/emtia/${c.slug}`} className="font-medium text-foreground hover:text-primary">
                              {c.name}
                            </Link>
                          </th>
                          <td className="num px-3 py-3 text-right text-foreground">{s ? formatCommodity(c, s.last) : '—'}</td>
                          <td className="px-3 py-3 text-[13px] text-muted-foreground">{c.unit}</td>
                          <td className={cn('num px-3 py-3 text-right', ch > 0 && 'text-up', ch < 0 && 'text-down', ch === 0 && 'text-neutral')}>
                            {s?.changePct != null ? pctTr(ch, { signed: true }) : '—'}
                          </td>
                          <td className="px-5 py-3 text-right text-[12px] text-muted-foreground">{s ? formatDateTr(s.date) : '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          );
        })}
      </div>

      <div className="mt-12 max-w-3xl">
        <FaqBlock title="Emtia hakkında sık sorulanlar" faqs={FAQS} />
      </div>
    </div>
  );
}
