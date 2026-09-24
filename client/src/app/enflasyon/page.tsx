import type { Metadata } from 'next';
import { SITE_NAME, SITE_URL } from '@/lib/constants';
import { SectionIntro } from '@/components/shared/SectionIntro';
import { EnflasyonBreadcrumb } from '@/components/enflasyon/EnflasyonBreadcrumb';
import { EnflasyonHero } from '@/components/enflasyon/EnflasyonHero';
import { EnflasyonSnippet } from '@/components/enflasyon/EnflasyonSnippet';
import { EnflasyonCompareTable } from '@/components/enflasyon/EnflasyonCompareTable';
import { EnflasyonExplainer } from '@/components/enflasyon/EnflasyonExplainer';
import { AdBanner } from '@/components/ads/AdBanner';
import { fetchTufeLatest, fetchUfeLatest, fetchTufeAll, fetchUfeAll } from '@/lib/inflation';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Enflasyon Verileri — TÜFE ve ÜFE | Güncel Aylık ve Yıllık Değişim',
  description:
    'TÜFE ve Yİ-ÜFE’nin güncel aylık ve yıllık değişim oranları, son 12 ay karşılaştırması. TÜİK tarafından açıklanan veriler, TCMB üzerinden alınır.',
  keywords: ['enflasyon', 'tüfe', 'üfe', 'yi-üfe', 'tüketici fiyat endeksi', 'üretici fiyat endeksi', 'aylık enflasyon', 'yıllık enflasyon'],
  alternates: { canonical: `${SITE_URL}/enflasyon` },
  openGraph: {
    type: 'website',
    title: 'Enflasyon Verileri — TÜFE ve ÜFE | FinansÇözüm',
    description: 'Güncel TÜFE ve ÜFE / Yİ-ÜFE verileri, son 12 ay karşılaştırması. TÜİK verileri, TCMB üzerinden.',
    url: `${SITE_URL}/enflasyon`,
    siteName: SITE_NAME,
    locale: 'tr_TR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Enflasyon Verileri — TÜFE ve ÜFE',
    description: 'Güncel TÜFE ve ÜFE / Yİ-ÜFE verileri, son 12 ay karşılaştırması.',
  },
};

export default async function EnflasyonPage() {
  // 4 paralel fetch — ISR cache'leniyor (revalidate 3600)
  const [tufeLatest, ufeLatest, tufeAll, ufeAll] = await Promise.all([
    fetchTufeLatest(),
    fetchUfeLatest(),
    fetchTufeAll(),
    fetchUfeAll(),
  ]);

  const tufeData = tufeLatest?.latest && tufeLatest?.previous
    ? { latest: tufeLatest.latest, previous: tufeLatest.previous }
    : null;
  const ufeData = ufeLatest?.latest && ufeLatest?.previous
    ? { latest: ufeLatest.latest, previous: ufeLatest.previous }
    : null;

  return (
    <>
      {/* Server-rendered H1 — SEO + accessibility */}
      <div className="mx-auto max-w-[1440px] px-4 pt-6 lg:px-8">
        <EnflasyonBreadcrumb items={[{ label: 'Enflasyon Verileri' }]} />
        <SectionIntro
          as="page"
          title="Enflasyon Verileri"
          description="TÜFE (Tüketici Fiyat Endeksi) ve ÜFE / Yİ-ÜFE (Yurt İçi Üretici Fiyat Endeksi) güncel aylık ve yıllık değişim oranları. Veriler TÜİK tarafından açıklanır; TCMB üzerinden alınır."
        />
      </div>

      <div className="mx-auto max-w-[1440px] px-4 lg:px-8">
        <EnflasyonSnippet
          tufeLatest={tufeLatest?.latest ?? null}
          ufeLatest={ufeLatest?.latest ?? null}
        />

        <EnflasyonHero tufe={tufeData} ufe={ufeData} />

        <AdBanner page="enflasyon" position="top" className="my-8" />

        <h2 className="font-display text-2xl text-foreground sm:text-3xl mb-3 mt-8">Son 12 Ay Karşılaştırması</h2>
        <EnflasyonCompareTable tufe={tufeAll?.history ?? null} ufe={ufeAll?.history ?? null} months={12} />

        <AdBanner page="enflasyon" position="bottom" className="my-8" />

        <EnflasyonExplainer />
      </div>
    </>
  );
}