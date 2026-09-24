import { Suspense } from 'react';
import type { Metadata } from 'next';
import { AltinClient } from './AltinClient';
import { SectionIntro } from '@/components/shared/SectionIntro';
import { Breadcrumb } from '@/components/shared/Breadcrumb';
import { FaqBlock } from '@/components/instrument/FaqBlock';
import { GOLD_META } from '@/lib/seo-data/gold';
import { GOLD_ENTRIES } from '@/lib/instruments/gold';
import { SITE_URL } from '@/lib/constants';
import { safeJsonLd } from '@/lib/json-ld';

export const metadata: Metadata = {
  title: 'Altın Fiyatları Bugün | Gram, Çeyrek, Ons Canlı',
  description:
    "Gram, çeyrek, yarım, tam, Cumhuriyet, ata, bilezik ve ons altın fiyatlarını serbest piyasa, Kapalıçarşı, Harem, Altınkaynak ve bankalardan anlık karşılaştırın.",
  keywords: ['altın fiyatları', 'gram altın', 'çeyrek altın', 'canlı altın', 'altın fiyatları bugün'],
  alternates: { canonical: `${SITE_URL}/altin` },
};

const FAQS = [
  {
    q: 'Altın fiyatları neden kaynaktan kaynağa farklı?',
    a: 'Her kuyumcu, döviz bürosu ve banka kendi alış-satış fiyatını belirler. Fark; işlem hacmi, işçilik payı ve kurumun makas politikasından kaynaklanır. Bu sayfada kaynakları sekmelerle karşılaştırabilirsiniz.',
  },
  {
    q: 'Makas ne demek?',
    a: 'Makas, satış fiyatı ile alış fiyatı arasındaki farkın alış fiyatına oranıdır. Makas ne kadar düşükse alıp hemen satmanın maliyeti o kadar azdır.',
  },
  {
    q: 'Gram altın fiyatı nasıl hesaplanır?',
    a: 'Gram altın fiyatı, uluslararası ons altın fiyatının (USD) 31,1035\'e bölünüp USD/TRY kuruyla çarpılmasıyla yaklaşık olarak bulunur; piyasada buna alış-satış farkı eklenir.',
  },
];

export default function AltinPage() {
  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Altın türleri',
    itemListElement: GOLD_ENTRIES.map((g, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: GOLD_META[g.slug]?.name ?? g.liveName,
      url: `${SITE_URL}/altin/${g.slug}`,
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(itemList) }} />
      {/* Sunucuda render edilen H1 (istemci adasında olsaydı ilk HTML'de boş kalırdı) */}
      <div className="mx-auto max-w-[1440px] px-4 pt-6 lg:px-8">
        <Breadcrumb items={[{ label: 'Ana Sayfa', href: '/' }, { label: 'Altın' }]} />
        <SectionIntro
          as="page"
          eyebrow="Piyasalar"
          title="Altın fiyatları"
          description="Gram, çeyrek, yarım, tam, Cumhuriyet, ata, bilezik, ons altın ve gümüş fiyatlarını kaynak bazında karşılaştırın. Her türün grafikli detay sayfası var."
        />
      </div>
      <Suspense>
        <AltinClient />
      </Suspense>
      <div className="mx-auto max-w-[1440px] px-4 pb-24 lg:px-8 md:pb-12">
        <div className="max-w-3xl">
          <FaqBlock title="Altın fiyatları hakkında" faqs={FAQS} />
        </div>
      </div>
    </>
  );
}
