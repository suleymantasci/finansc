import { safeJsonLd } from '@/lib/json-ld';
import type { Metadata } from 'next';
import { Shield, Mail, AlertCircle, CheckCircle2, Globe } from 'lucide-react';
import Link from 'next/link';
import { SITE_NAME, SITE_URL } from '@/lib/constants';
import { BORSA_ENABLED } from '@/lib/features';

export const metadata: Metadata = {
  title: 'Kaynak Politikası ve Veri Doğrulama',
  description:
    'FinansÇözüm olarak verilerimizi nereden aldığımızı, nasıl doğruladığımızı ve güncellediğimizi açıklıyoruz. Şeffaflık ve güvenilirlik ilkelerimiz.',
  alternates: { canonical: `${SITE_URL}/kaynak-politikasi` },
  openGraph: {
    images: [{ url: `${SITE_URL}/og-default.png`, width: 1200, height: 630, alt: SITE_NAME }],
    title: 'Kaynak Politikası ve Veri Doğrulama | FinansÇözüm',
    description: 'Veri kaynaklarımız, güncelleme sıklığımız ve doğrulama süreçlerimiz.',
    url: `${SITE_URL}/kaynak-politikasi`,
    type: 'article',
    locale: 'tr_TR',
  },
};

// Kaynak açıklamaları ve sıklıklar gerçek toplama yöntemini yansıtmalı (tasci-api ayarları).
// Lisans, ortaklık veya "resmî veri" iddiası içermemeli — bkz. docs/hukuk/RAPOR.md
const SOURCES = [
  {
    name: 'Altın fiyatları',
    category: 'Serbest piyasa, Kapalıçarşı, Harem Altın, Altınkaynak, Garanti BBVA, Akbank',
    description:
      'Bu piyasaların kamuya açık fiyat yayınlarından otomatik olarak derlenir. Kurum adları yalnızca fiyatın ait olduğu piyasayı belirtir; bu kurumlarla bir ortaklığımız yoktur.',
    updateFrequency: 'Gündüz ~30 sn, gece ~60 sn',
  },
  {
    name: 'Serbest piyasa döviz kurları',
    category: 'Döviz',
    description: 'Kamuya açık serbest piyasa kur yayınlarından otomatik olarak derlenir; banka ve döviz bürolarının işlem kurlarından farklı olabilir.',
    updateFrequency: '~30 saniye',
  },
  {
    name: 'Türkiye Cumhuriyet Merkez Bankası (TCMB)',
    category: 'Gösterge döviz kurları, enflasyon (TÜFE/ÜFE)',
    description:
      'TCMB’nin ilan ettiği gösterge niteliğindeki kurlar ve TCMB’nin yayımladığı, TÜİK kaynaklı enflasyon tabloları. TCMB kurları her iş günü saat 15.30’da ilan edilir.',
    updateFrequency: 'Kur: saatlik kontrol · Enflasyon: aylık',
  },
  ...(BORSA_ENABLED ? [{
    name: 'Borsa İstanbul hisse ve endeksleri',
    category: 'Borsa',
    description:
      'Kamuya açık, gecikmeli fiyat yayınlarından otomatik olarak derlenir. Veriler en az 15 dakika gecikmelidir; FinansÇözüm, Borsa İstanbul A.Ş. ile bağlantılı değildir.',
    updateFrequency: 'Seans içinde ~30 sn (15+ dk gecikmeli)',
  }] : []),
  {
    name: 'Geçmiş fiyat grafikleri ve emtia',
    category: 'Grafikler',
    description:
      'Günlük kapanış serileri kamuya açık piyasa veri yayınlarından derlenir; uluslararası ons altın/gümüş geçmişi için LBMA referans fiyatları kullanılır.',
    updateFrequency: 'Günlük',
  },
];

export default function KaynakPolitikasiPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Kaynak Politikası',
    description: 'FinansÇözüm veri kaynakları, güncelleme sıklığı ve doğrulama süreçleri',
    inLanguage: 'tr-TR',
    isPartOf: { '@id': 'https://finanscozum.net/#website' },
    publisher: { '@id': 'https://finanscozum.net/#organization' },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
      />
      <div className="mx-auto max-w-4xl px-4 py-12 lg:px-8">
        <header className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="font-display text-balance text-4xl text-foreground sm:text-5xl">Kaynak Politikası</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Son güncelleme: 24 Eylül 2026
          </p>
        </header>

        <section className="prose prose-slate dark:prose-invert max-w-none">
          <p className="lead text-lg text-muted-foreground">
            <strong className="text-foreground">{SITE_NAME}</strong> olarak kullanıcılarımıza sunduğumuz tüm
            verilerin doğruluğu, güncelliği ve şeffaflığı önceliğimizdir. Bu sayfa, hangi verileri nereden
            aldığımızı, ne sıklıkla güncellendiğini ve doğrulama süreçlerimizi açıkça belgelemek için
            hazırlanmıştır.
          </p>

          <h2 className="font-display text-2xl text-foreground sm:text-3xl mt-10 mb-4">Veri Kaynaklarımız</h2>
          <p>
            Sitedeki piyasa verileri aşağıdaki kaynaklardan otomatik olarak derlenir. Resmî kurum verisi (TCMB)
            dışındaki fiyatlar bilgi amaçlıdır; gecikmeli, eksik veya hatalı olabilir ve resmî fiyat yerine geçmez.
          </p>

          <div className="not-prose mt-6 space-y-4">
            {SOURCES.map((source) => (
              <div key={source.name} className="atlas-card p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-base">{source.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{source.category}</p>
                    <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                      {source.description}
                    </p>
                  </div>
                  <div className="text-xs text-muted-foreground whitespace-nowrap flex items-center gap-1.5">
                    <CheckCircle2 className="h-3 w-3" />
                    {source.updateFrequency}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <h2 className="font-display text-2xl text-foreground sm:text-3xl mt-10 mb-4">Veri Doğrulama Süreci</h2>
          <p>
            Veriler yayınlanmadan önce aşağıdaki otomatik kontrollerden geçer:
          </p>
          <ol className="space-y-2 mt-4">
            <li>
              <strong>Resmî kaynak:</strong> Gösterge kurlar ve enflasyon gibi resmî kurumca ilan edilen verilerde
              TCMB yayını esas alınır.
            </li>
            <li>
              <strong>Kaynak karşılaştırma:</strong> Altın fiyatları birden fazla piyasa için ayrı ayrı gösterilir;
              kullanıcı kaynaklar arasındaki farkı sekmelerden karşılaştırabilir.
            </li>
            <li>
              <strong>Yayın:</strong> Güncellenen fiyatlar sayfaya otomatik iletilir; bağlantı koparsa otomatik
              olarak yeniden kurulur.{BORSA_ENABLED && ' Borsa verileri bu yolla da en az 15 dakika gecikmeli gelir.'}
            </li>
            <li>
              <strong>Gecikmiş veri işaretleme:</strong> Piyasa kapalıyken son bilinen fiyat gösterilir ve
              "piyasa kapalı" rozeti ile kullanıcı bilgilendirilir.
            </li>
          </ol>

          <h2 className="font-display text-2xl text-foreground sm:text-3xl mt-10 mb-4">İçerik Kaynakları</h2>
          <p>
            Bilgi merkezi yazıları yapay zekâ araçları desteğiyle hazırlanır ve mümkün olduğunca aşağıdaki
            türden birincil kaynaklara dayandırılır. Yazılarda hata görürseniz lütfen bildirin:
          </p>
          <ul className="space-y-1 mt-2">
            <li>TCMB politika metinleri ve faiz kararları</li>
            <li>TÜİK resmi istatistik yayınları</li>
            <li>Yürürlükteki mevzuat (Resmî Gazete) ve kamu kurumlarının duyuruları</li>
            <li>KAP bildirimleri</li>
          </ul>

          <h2 className="font-display text-2xl text-foreground sm:text-3xl mt-10 mb-4">Yasal Uyarı</h2>
          <div className="not-prose rounded-lg border-l-4 border-amber-500 bg-amber-500/5 p-4 text-sm">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-muted-foreground">
                <strong className="text-foreground">Yatırım tavsiyesi değildir.</strong> Platformumuzdaki
                tüm fiyat, oran ve analiz içerikleri yalnızca <em>bilgilendirme amaçlıdır</em>. Yatırım
                kararlarınızı vermeden önce ilgili kurumların resmi kanallarını ve uzman görüşünü dikkate
                almanızı öneriyoruz. {SITE_NAME}, verilerin kullanımından doğabilecek zararlardan sorumlu
                tutulamaz.
              </p>
            </div>
          </div>

          <h2 className="font-display text-2xl text-foreground sm:text-3xl mt-10 mb-4">Veri Hatası Bildirimi</h2>
          <p>
            Herhangi bir veride hata, gecikme veya tutarsızlık tespit ederseniz lütfen bize bildirin:
          </p>
          <div className="not-prose mt-4 flex flex-col sm:flex-row gap-3">
            <a
              href="mailto:info@finanscozum.net?subject=Veri%20Hatası%20Bildirimi"
              className="inline-flex items-center gap-2 atlas-card px-4 py-2.5 text-sm font-medium hover:border-primary/30 transition-colors"
            >
              <Mail className="h-4 w-4" />
              info@finanscozum.net
            </a>
            <Link
              href="/iletisim"
              className="inline-flex items-center gap-2 atlas-card px-4 py-2.5 text-sm font-medium hover:border-primary/30 transition-colors"
            >
              <Globe className="h-4 w-4" />
              İletişim formu
            </Link>
          </div>

          <h2 className="font-display text-2xl text-foreground sm:text-3xl mt-10 mb-4">İlgili Sayfalar</h2>
          <ul>
            <li>
              <Link href="/duzeltme-politikasi">Düzeltme Politikası</Link> — Hata düzeltme sürecimiz
            </li>
            <li>
              <Link href="/editor-ekibi">Editör Ekibi</Link> — İçerik üreticilerimiz
            </li>
            <li>
              <Link href="/hakkimizda">Hakkımızda</Link> — Misyon ve vizyonumuz
            </li>
          </ul>
        </section>
      </div>
    </>
  );
}
