import type { Metadata } from 'next';
import { Shield, Mail, AlertCircle, CheckCircle2, Globe } from 'lucide-react';
import Link from 'next/link';
import { SITE_NAME, SITE_URL } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Kaynak Politikası ve Veri Doğrulama',
  description:
    'FinansÇözüm olarak verilerimizi nereden aldığımızı, nasıl doğruladığımızı ve güncellediğimizi açıklıyoruz. Şeffaflık ve güvenilirlik ilkelerimiz.',
  alternates: { canonical: `${SITE_URL}/kaynak-politikasi` },
  openGraph: {
    title: 'Kaynak Politikası ve Veri Doğrulama | FinansÇözüm',
    description: 'Veri kaynaklarımız, güncelleme sıklığımız ve doğrulama süreçlerimiz.',
    url: `${SITE_URL}/kaynak-politikasi`,
    type: 'article',
    locale: 'tr_TR',
  },
};

const SOURCES = [
  {
    name: 'Harem Altın',
    category: 'Altın Fiyatları',
    description:
      'İstanbul Kuyumcular Odası verilerine dayalı, Türkiye\'nin önde gelen altın fiyat sağlayıcılarından biri. Serbest piyasa alış-satış fiyatları referans alınır.',
    updateFrequency: '1-3 saniye (canlı)',
  },
  {
    name: 'Altınkaynak',
    category: 'Altın Fiyatları',
    description:
      'Türkiye genelinde birçok kuyumcudan derlenen altın fiyat verileri. Karşılaştırma için ek kaynak olarak kullanılır.',
    updateFrequency: '30 saniye',
  },
  {
    name: 'Kapalıçarşı',
    category: 'Altın Fiyatları',
    description: 'Kapalıçarşı serbest piyasa altın fiyatları referans değerleri.',
    updateFrequency: '1 dakika',
  },
  {
    name: 'Garanti BBVA',
    category: 'Banka Altın Kurları',
    description: 'Garanti BBVA bankası altın alış-satış kurları (karşılaştırma için).',
    updateFrequency: '15 dakika',
  },
  {
    name: 'Akbank',
    category: 'Banka Altın Kurları',
    description: 'Akbank bankası altın alış-satış kurları (karşılaştırma için).',
    updateFrequency: '15 dakika',
  },
  {
    name: 'Borsa İstanbul (BIST)',
    category: 'Hisse Senetleri ve Endeksler',
    description:
      'BIST\'te işlem gören tüm hisse senetleri, XU100, XU030, XU050 endeksleri canlı verileri.',
    updateFrequency: 'Anlık (SSE/WebSocket)',
  },
  {
    name: 'Türkiye Cumhuriyet Merkez Bankası (TCMB)',
    category: 'Döviz Kurları',
    description:
      'TCMB tarafından yayınlanan resmi döviz kurları. Merkez Bankası kuru referans olarak gösterilir.',
    updateFrequency: 'Günde 5 yayın (saat 10:30, 11:30, 12:30, 13:30, 14:30)',
  },
  {
    name: 'Serbest Piyasa',
    category: 'Döviz Kurları',
    description: 'Bankalar ve döviz bürolarının oluşturduğu serbest piyasa kurları.',
    updateFrequency: '1-3 saniye (canlı)',
  },
  {
    name: 'TÜİK (Türkiye İstatistik Kurumu)',
    category: 'Enflasyon ve Makro Veriler',
    description:
      'TÜFE, ÜFE, işsizlik oranı ve diğer makroekonomik göstergeler için TÜİK resmi verileri kullanılır.',
    updateFrequency: 'Aylık',
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="mx-auto max-w-4xl px-4 py-12 lg:px-8">
        <header className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Kaynak Politikası</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Son güncelleme: 2 Haziran 2026
          </p>
        </header>

        <section className="prose prose-slate dark:prose-invert max-w-none">
          <p className="lead text-lg text-muted-foreground">
            <strong className="text-foreground">{SITE_NAME}</strong> olarak kullanıcılarımıza sunduğumuz tüm
            verilerin doğruluğu, güncelliği ve şeffaflığı önceliğimizdir. Bu sayfa, hangi verileri nereden
            aldığımızı, ne sıklıkla güncellendiğini ve doğrulama süreçlerimizi açıkça belgelemek için
            hazırlanmıştır.
          </p>

          <h2 className="text-2xl font-semibold mt-10 mb-4">Veri Kaynaklarımız</h2>
          <p>
            Platformumuzdaki tüm finansal veriler, aşağıdaki güvenilir kaynaklardan elde edilir. Her kaynak
            kendi kategorisinde Türkiye\'nin önde gelen veri sağlayıcıları arasında yer alır.
          </p>

          <div className="not-prose mt-6 space-y-4">
            {SOURCES.map((source) => (
              <div key={source.name} className="rounded-lg border border-border bg-card p-4">
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

          <h2 className="text-2xl font-semibold mt-10 mb-4">Veri Doğrulama Süreci</h2>
          <p>
            Platformumuzdaki her veri türü için aşağıdaki doğrulama adımları uygulanır:
          </p>
          <ol className="space-y-2 mt-4">
            <li>
              <strong>Birincil kaynak tercihi:</strong> Resmi kurumların yayınladığı veriler (TCMB, TÜİK,
              BIST) her zaman öncelikli referans olarak alınır.
            </li>
            <li>
              <strong>Çapraz kontrol:</strong> Altın ve döviz fiyatları birden fazla bağımsız kaynaktan
              karşılaştırılır; anomali durumunda kaynak değiştirilir veya uyarı gösterilir.
            </li>
            <li>
              <strong>Canlı yayın doğrulama:</strong> BIST ve döviz verileri Server-Sent Events (SSE)
              ile gerçek zamanlı yayınlanır; gecikme veya kesinti durumunda otomatik yeniden bağlantı
              sağlanır.
            </li>
            <li>
              <strong>Gecikmiş veri işaretleme:</strong> Piyasa kapalıyken son bilinen fiyat gösterilir ve
              "piyasa kapalı" rozeti ile kullanıcı bilgilendirilir.
            </li>
          </ol>

          <h2 className="text-2xl font-semibold mt-10 mb-4">İçerik Kaynakları</h2>
          <p>
            Blog yazılarımız ve bilgi merkezi içeriklerimiz aşağıdaki kaynaklara dayanır:
          </p>
          <ul className="space-y-1 mt-2">
            <li>TCMB politika metinleri ve faiz kararları</li>
            <li>TÜİK resmi istatistik yayınları</li>
            <li>BIST şirket açıklamaları ve KAP bildirimleri</li>
            <li>Uluslararası finans kuruluşlarının raporları (IMF, Dünya Bankası, BIS)</li>
            <li>Akademik finansal literatür</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-10 mb-4">Yasal Uyarı</h2>
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

          <h2 className="text-2xl font-semibold mt-10 mb-4">Veri Hatası Bildirimi</h2>
          <p>
            Herhangi bir veride hata, gecikme veya tutarsızlık tespit ederseniz lütfen bize bildirin:
          </p>
          <div className="not-prose mt-4 flex flex-col sm:flex-row gap-3">
            <a
              href="mailto:editor@finanscozum.com?subject=Veri%20Hatası%20Bildirimi"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium hover:border-primary/30 transition-colors"
            >
              <Mail className="h-4 w-4" />
              editor@finanscozum.com
            </a>
            <Link
              href="/iletisim"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium hover:border-primary/30 transition-colors"
            >
              <Globe className="h-4 w-4" />
              İletişim formu
            </Link>
          </div>

          <h2 className="text-2xl font-semibold mt-10 mb-4">İlgili Sayfalar</h2>
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
