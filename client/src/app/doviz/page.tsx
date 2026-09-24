import { Suspense } from 'react';
import type { Metadata } from 'next';
import { DovizClient } from './DovizClient';
import { SectionIntro } from '@/components/shared/SectionIntro';
import { Breadcrumb } from '@/components/shared/Breadcrumb';
import { FaqBlock } from '@/components/instrument/FaqBlock';
import { CURRENCIES } from '@/lib/instruments/currencies';
import { SITE_URL } from '@/lib/constants';
import { safeJsonLd } from '@/lib/json-ld';

export const metadata: Metadata = {
  title: 'Döviz Kurları Bugün | Dolar, Euro, Sterlin Canlı',
  description:
    'Dolar, euro, sterlin ve 50’den fazla para biriminin serbest piyasa ve TCMB kurları; her kur için grafik ve çevirici.',
  keywords: ['döviz kurları', 'dolar kuru', 'euro kuru', 'serbest piyasa', 'merkez bankası', 'canlı döviz'],
  alternates: { canonical: `${SITE_URL}/doviz` },
};

const FAQS = [
  {
    q: 'Serbest piyasa kuru ile TCMB kuru arasındaki fark nedir?',
    a: 'Serbest piyasa kuru, döviz bürolarında ve bankalararası piyasada gün içinde sürekli değişen fiyattır. TCMB gösterge kuru ise Merkez Bankası tarafından günlük olarak ilan edilen resmi referans kurdur; resmi işlemlerde kullanılır.',
  },
  {
    q: 'Döviz kurları ne sıklıkla güncellenir?',
    a: 'Serbest piyasa kurları piyasa açıkken canlı akışla güncellenir. TCMB kurları gün içinde ilan edildiği saatte güncellenir.',
  },
];

export default function DovizPage() {
  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Döviz kurları',
    itemListElement: CURRENCIES.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: `${c.code}/TRY ${c.name}`, url: `${SITE_URL}/doviz/${c.slug}` })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(itemList) }} />
      <div className="mx-auto max-w-[1440px] px-4 pt-6 lg:px-8">
        <Breadcrumb items={[{ label: 'Ana Sayfa', href: '/' }, { label: 'Döviz' }]} />
        <SectionIntro
          as="page"
          eyebrow="Piyasalar"
          title="Döviz kurları"
          description="Serbest piyasa ve TCMB kurlarını karşılaştırın. Dolar, euro, sterlin ve 50’den fazla para biriminin grafikli detay sayfası ve çeviricisi var."
        />
      </div>
      <Suspense>
        <DovizClient />
      </Suspense>
      <div className="mx-auto max-w-[1440px] px-4 pb-24 lg:px-8 md:pb-12">
        <div className="max-w-3xl">
          <FaqBlock title="Döviz kurları hakkında" faqs={FAQS} />
        </div>
      </div>
    </>
  );
}
