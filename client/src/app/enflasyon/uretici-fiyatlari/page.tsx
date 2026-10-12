import { safeJsonLd } from '@/lib/json-ld';
import type { Metadata } from 'next';
import { SITE_NAME, SITE_URL } from '@/lib/constants';
import { SectionIntro } from '@/components/shared/SectionIntro';
import { EnflasyonBreadcrumb } from '@/components/enflasyon/EnflasyonBreadcrumb';
import { EnflasyonExplainer } from '@/components/enflasyon/EnflasyonExplainer';
import { AdBanner } from '@/components/ads/AdBanner';
import { fetchUfeLatest, fetchUfeAll, formatPercentTr } from '@/lib/inflation';
import { UfeClient } from './UfeClient';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Yİ-ÜFE Verileri: Üretici Fiyat Endeksi',
  description:
    'ÜFE ve Yİ-ÜFE (Yurt İçi Üretici Fiyat Endeksi) yıllık ve aylık değişim verileri. 2003’ten bugüne aylık veriler, sıralanabilir tablo. TÜİK verileri, TCMB üzerinden.',
  keywords: ['üfe', 'yi-üfe', 'yurt içi üretici fiyat endeksi', 'üretici enflasyonu', 'üretici fiyat endeksi'],
  alternates: { canonical: `${SITE_URL}/enflasyon/uretici-fiyatlari` },
  openGraph: {
    type: 'website',
    title: 'ÜFE / Yİ-ÜFE — Yurt İçi Üretici Fiyat Endeksi',
    description: 'ÜFE ve Yİ-ÜFE yıllık ve aylık değişim verileri. TÜİK verileri, TCMB üzerinden.',
    url: `${SITE_URL}/enflasyon/uretici-fiyatlari`,
    siteName: SITE_NAME,
    locale: 'tr_TR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ÜFE / Yİ-ÜFE — Yurt İçi Üretici Fiyat Endeksi',
    description: 'ÜFE ve Yİ-ÜFE yıllık ve aylık değişim verileri.',
  },
};

export default async function UfePage() {
  const [latest, all] = await Promise.all([fetchUfeLatest(), fetchUfeAll()]);

  const ufeLatest = latest?.latest ?? null;
  const ufePrevious = latest?.previous ?? null;
  const rows = all?.history ?? [];

  const snippetText =
    ufeLatest && ufeLatest.yiUfeYearlyChange !== null
      ? `Yİ-ÜFE yıllık ${formatPercentTr(ufeLatest.yiUfeYearlyChange)}, aylık ${formatPercentTr(ufeLatest.yiUfeMonthlyChange)} değişim. Kaynak: TÜİK (TCMB üzerinden).`
      : 'ÜFE / Yİ-ÜFE yıllık ve aylık değişim verileri. Kaynak: TÜİK (TCMB üzerinden).';

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: safeJsonLd({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'ÜFE / Yİ-ÜFE — Yurt İçi Üretici Fiyat Endeksi',
            url: `${SITE_URL}/enflasyon/uretici-fiyatlari`,
            speakable: {
              '@type': 'SpeakableSpecification',
              cssSelector: ['#ufe-summary', 'h1'],
            },
            dateModified: latest?.scrapedAt,
          }),
        }}
      />

      <div className="mx-auto max-w-[1440px] px-4 pt-6 lg:px-8">
        <EnflasyonBreadcrumb
          items={[
            { label: 'Enflasyon Verileri', href: '/enflasyon' },
            { label: 'ÜFE / Yİ-ÜFE' },
          ]}
        />
        <SectionIntro
          as="page"
          title="ÜFE / Yİ-ÜFE — Yurt İçi Üretici Fiyat Endeksi"
          description="Türkiye İstatistik Kurumu tarafından hesaplanan Yurt İçi Üretici Fiyat Endeksi'nin aylık ve yıllık yüzde değişim oranları. Veriler TCMB üzerinden yayımlanır."
        />
      </div>

      <div className="mx-auto max-w-[1440px] px-4 lg:px-8">
        <p
          id="ufe-summary"
          className="mb-6 rounded-lg border-l-4 border-primary bg-primary/5 p-4 text-sm leading-relaxed"
        >
          {snippetText}
        </p>

        {ufeLatest && ufePrevious && (
          <div className="mb-6 grid gap-3 atlas-card p-4 sm:grid-cols-2">
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Son Dönem</div>
              <div className="mt-1 num text-2xl font-bold tabular-nums text-primary">
                {formatPercentTr(ufeLatest.yiUfeYearlyChange)}
              </div>
              <div className="text-xs text-muted-foreground">
                Yİ-ÜFE Yıllık • Aylık {formatPercentTr(ufeLatest.yiUfeMonthlyChange)}
              </div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Önceki Dönem</div>
              <div className="mt-1 num text-2xl font-bold tabular-nums text-foreground">
                {formatPercentTr(ufePrevious.yiUfeYearlyChange)}
              </div>
              <div className="text-xs text-muted-foreground">
                Yİ-ÜFE Yıllık • Aylık {formatPercentTr(ufePrevious.yiUfeMonthlyChange)}
              </div>
            </div>
          </div>
        )}

        <h2 className="font-display text-2xl text-foreground sm:text-3xl mb-3 mt-8">Tarihsel Veriler</h2>
        {rows.length > 0 ? (
          <UfeClient rows={rows} />
        ) : (
          <div className="atlas-card p-6 text-sm text-muted-foreground">
            Tarihsel tablo yüklenemedi.
          </div>
        )}

        <AdBanner page="enflasyon-ufe" position="bottom" className="my-8" />

        <EnflasyonExplainer />
      </div>
    </>
  );
}