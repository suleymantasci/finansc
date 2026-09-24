import { Suspense } from 'react';
import type { Metadata } from 'next';
import { BorsaClient } from './BorsaClient';
import { SectionIntro } from '@/components/shared/SectionIntro';
import { Breadcrumb } from '@/components/shared/Breadcrumb';
import { FaqBlock } from '@/components/instrument/FaqBlock';
import { SITE_URL } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Borsa İstanbul Hisseleri ve Endeksleri | BIST 100',
  description:
    'Borsa İstanbul’daki tüm hisse senetleri ve endeksler: son fiyat, günlük değişim, gün içi aralık ve işlem hacmi. Her hisse ve endeksin grafikli sayfası var.',
  keywords: ['borsa istanbul', 'bist', 'hisse senedi', 'xu100', 'bist 100', 'borsa'],
  alternates: { canonical: `${SITE_URL}/borsa` },
};

const FAQS = [
  {
    q: 'Borsa İstanbul hangi saatlerde açık?',
    a: 'Pay piyasasında sürekli işlem seansı hafta içi 10:00–18:00 arasındadır; ardından kapanış seansı yapılır. Resmî tatillerde piyasa kapalıdır.',
  },
  {
    q: 'Bu sayfadaki borsa verileri canlı mı?',
    a: 'Hayır. Borsa İstanbul hisse ve endeks verileri, BIST veri yayın kuralları gereği 15 dakika gecikmeli gösterilir.',
  },
  {
    q: 'İşlem hacmi (₺) neyi gösterir?',
    a: 'Gün içinde o hissede el değiştiren toplam tutarın Türk lirası karşılığıdır. Yüksek hacim, hissede alım-satım ilgisinin yoğun olduğunu gösterir.',
  },
];

export default function BorsaPage() {
  return (
    <>
      {/* Sunucuda render edilen H1 */}
      <div className="mx-auto max-w-[1440px] px-4 pt-6 lg:px-8">
        <Breadcrumb items={[{ label: 'Ana Sayfa', href: '/' }, { label: 'Borsa' }]} />
        <SectionIntro
          as="page"
          eyebrow="Piyasalar"
          title="Borsa İstanbul"
          description="Tüm hisse senetleri ve endeksler tek listede. Sıralayın, arayın; her hissenin ve endeksin grafikli sayfasına tek tıkla gidin."
        />
      </div>
      <Suspense>
        <BorsaClient />
      </Suspense>
      <div className="mx-auto max-w-[1440px] px-4 pb-24 lg:px-8 md:pb-12">
        <div className="max-w-3xl">
          <FaqBlock title="Borsa hakkında" faqs={FAQS} />
        </div>
      </div>
    </>
  );
}
