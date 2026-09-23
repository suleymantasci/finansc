import { safeJsonLd } from '@/lib/json-ld';
import type { Metadata } from 'next';
import { SITE_NAME, SITE_URL } from '@/lib/constants';
import { SectionIntro } from '@/components/shared/SectionIntro';
import { EnflasyonBreadcrumb } from '@/components/enflasyon/EnflasyonBreadcrumb';
import { EnflasyonSnippet } from '@/components/enflasyon/EnflasyonSnippet';
import { EnflasyonExplainer } from '@/components/enflasyon/EnflasyonExplainer';
import { AdBanner } from '@/components/ads/AdBanner';
import { fetchTufeLatest, fetchTufeAll, formatPercentTr } from '@/lib/inflation';
import { TufeClient } from './TufeClient';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'TÜFE — Tüketici Fiyat Endeksi Verileri (Tarihsel)',
  description:
    'TÜFE (Tüketici Fiyat Endeksi) yıllık ve aylık değişim verileri. 2003 yılından bugüne TCMB kaynaklı resmi enflasyon verileri, sıralanabilir tablo.',
  keywords: ['tüfe', 'tüketici fiyat endeksi', 'enflasyon', 'aylık enflasyon', 'yıllık enflasyon', 'tüfe tarihsel'],
  alternates: { canonical: `${SITE_URL}/enflasyon/tuketici-fiyatlari` },
  openGraph: {
    type: 'website',
    title: 'TÜFE — Tüketici Fiyat Endeksi Verileri',
    description: 'TÜFE yıllık ve aylık değişim verileri. 2003 yılından bugüne TCMB kaynaklı.',
    url: `${SITE_URL}/enflasyon/tuketici-fiyatlari`,
    siteName: SITE_NAME,
    locale: 'tr_TR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TÜFE — Tüketici Fiyat Endeksi Verileri',
    description: 'TÜFE yıllık ve aylık değişim verileri.',
  },
};

export default async function TufePage() {
  const [latest, all] = await Promise.all([fetchTufeLatest(), fetchTufeAll()]);

  const tufeLatest = latest?.latest ?? null;
  const tufePrevious = latest?.previous ?? null;
  const rows = all?.history ?? [];

  // Snippet text: latest varsa gerçek değer, yoksa generic
  const snippetText =
    tufeLatest && tufeLatest.yearlyChange !== null
      ? `${formatPercentTr(tufeLatest.yearlyChange)} yıllık, ${formatPercentTr(tufeLatest.monthlyChange)} aylık değişim. Kaynak: TCMB / TÜİK.`
      : 'TÜFE yıllık ve aylık değişim verileri. Kaynak: TCMB / TÜİK.';

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: safeJsonLd({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'TÜFE — Tüketici Fiyat Endeksi',
            url: `${SITE_URL}/enflasyon/tuketici-fiyatlari`,
            speakable: {
              '@type': 'SpeakableSpecification',
              cssSelector: ['#tufe-summary', 'h1'],
            },
            dateModified: latest?.scrapedAt,
          }),
        }}
      />

      <div className="mx-auto max-w-7xl px-4 pt-6 lg:px-8">
        <EnflasyonBreadcrumb
          items={[
            { label: 'Enflasyon Verileri', href: '/enflasyon' },
            { label: 'TÜFE' },
          ]}
        />
        <SectionIntro
          as="page"
          title="TÜFE — Tüketici Fiyat Endeksi"
          description="Türkiye İstatistik Kurumu tarafından hesaplanan Tüketici Fiyat Endeksi'nin aylık ve yıllık yüzde değişim oranları. Veriler TCMB üzerinden yayımlanır."
        />
      </div>

      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <p
          id="tufe-summary"
          className="mb-6 rounded-lg border-l-4 border-primary bg-primary/5 p-4 text-sm leading-relaxed"
        >
          {snippetText}
        </p>

        {tufeLatest && tufePrevious && (
          <div className="mb-6 grid gap-3 rounded-lg border border-border bg-card p-4 sm:grid-cols-2">
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Son Dönem</div>
              <div className="mt-1 num text-2xl font-bold tabular-nums text-primary">
                {formatPercentTr(tufeLatest.yearlyChange)}
              </div>
              <div className="text-xs text-muted-foreground">
                Yıllık • Aylık {formatPercentTr(tufeLatest.monthlyChange)}
              </div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Önceki Dönem</div>
              <div className="mt-1 num text-2xl font-bold tabular-nums text-foreground">
                {formatPercentTr(tufePrevious.yearlyChange)}
              </div>
              <div className="text-xs text-muted-foreground">
                Yıllık • Aylık {formatPercentTr(tufePrevious.monthlyChange)}
              </div>
            </div>
          </div>
        )}

        <h2 className="mb-3 mt-8 text-xl font-bold tracking-tight">Tarihsel Veriler</h2>
        {rows.length > 0 ? (
          <TufeClient rows={rows} />
        ) : (
          <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
            Tarihsel tablo yüklenemedi.
          </div>
        )}

        <AdBanner page="enflasyon-tufe" position="bottom" className="my-8" />

        <EnflasyonExplainer />
      </div>
    </>
  );
}