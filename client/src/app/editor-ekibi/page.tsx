import { safeJsonLd } from '@/lib/json-ld';
import type { Metadata } from 'next';
import { Users, BookOpen, Shield } from 'lucide-react';
import Link from 'next/link';
import { SITE_NAME, SITE_URL } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Editör Ekibi ve Yayın İlkeleri',
  description:
    'FinansÇözüm içeriklerinin ve verilerinin nasıl hazırlandığı, yapay zekâ kullanımı ve yayın ilkeleri.',
  alternates: { canonical: `${SITE_URL}/editor-ekibi` },
  openGraph: {
    images: [{ url: `${SITE_URL}/og-default.png`, width: 1200, height: 630, alt: SITE_NAME }],
    title: 'Editör Ekibi | FinansÇözüm',
    description: 'İçerik hazırlama süreci ve yayın ilkeleri',
    url: `${SITE_URL}/editor-ekibi`,
    type: 'article',
    locale: 'tr_TR',
  },
};

interface Editor {
  name: string;
  role: string;
  bio: string;
  expertise: string[];
  initials: string;
}

const EDITORS: Editor[] = [
  {
    name: 'Finansal İçerik Ekibi',
    role: 'İçerik Yönetimi',
    initials: 'Fİ',
    bio: 'Bilgi merkezi yazılarının konularını belirler ve yapay zekâ araçları desteğiyle hazırlanan metinlerin yayın sürecini yönetir. Yazılar TCMB kararları, enflasyon verileri ve mevzuat gibi konuları anlaşılır biçimde aktarmayı amaçlar.',
    expertise: ['Makroekonomi', 'Borsa Analizi', 'Altın Piyasası', 'Döviz Piyasası'],
  },
  {
    name: 'Veri ve Analiz Ekibi',
    role: 'Veri Mühendisliği',
    initials: 'VA',
    bio: 'Piyasa verilerinin kamuya açık kaynaklardan otomatik olarak derlenmesi, sayfalara iletilmesi ve geçmiş fiyat serilerinin oluşturulması. Kaynaklar ve güncelleme sıklıkları Kaynak Politikası sayfasında açıklanır.',
    expertise: ['Veri Doğrulama', 'API Entegrasyonu', 'Piyasa Verisi', 'Kalite Kontrol'],
  },
  {
    name: 'İçerik Editörleri',
    role: 'Editoryal',
    initials: 'İE',
    bio: 'Hesaplama araçlarının formülleri ve rehber içerikler. Araçlar yürürlükteki oran ve kurallara göre güncellenir; bildirilen hatalar Düzeltme Politikası’na göre düzeltilir.',
    expertise: ['Finansal Yazarlık', 'SEO', 'Editöryal Süreç', 'İçerik Stratejisi'],
  },
];

export default function EditorEkibiPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    name: 'Editör Ekibi',
    description: 'FinansÇözüm içerik hazırlama süreci ve yayın ilkeleri',
    inLanguage: 'tr-TR',
    isPartOf: { '@id': 'https://finanscozum.net/#website' },
    publisher: { '@id': 'https://finanscozum.net/#organization' },
    mainEntity: {
      '@type': 'Organization',
      '@id': 'https://finanscozum.net/#organization',
      // Kişi değil ekip: Person yerine departman (yanıltıcı yapılandırılmış veri olmasın)
      department: EDITORS.map((e) => ({
        '@type': 'Organization',
        name: e.name,
        description: e.bio,
        knowsAbout: e.expertise,
        parentOrganization: { '@id': 'https://finanscozum.net/#organization' },
      })),
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
      />
      <div className="mx-auto max-w-5xl px-4 py-12 lg:px-8">
        <header className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <Users className="h-8 w-8 text-primary" />
            <h1 className="font-display text-balance text-4xl text-foreground sm:text-5xl">Editör Ekibimiz</h1>
          </div>
          <p className="text-sm text-muted-foreground">Son güncelleme: 24 Eylül 2026</p>
        </header>

        <section className="prose prose-slate dark:prose-invert max-w-none">
          <p className="lead text-lg text-muted-foreground">
            <strong className="text-foreground">{SITE_NAME}</strong> bağımsız bir finans bilgi
            platformudur. Aşağıda içeriklerin ve verilerin hangi süreçle hazırlandığını açıklıyoruz.
            Bilgi merkezi yazıları <strong className="text-foreground">yapay zekâ araçları desteğiyle</strong>{' '}
            hazırlanır; yazılar yatırım tavsiyesi değildir ve hata içerebilir.
          </p>

          <h2 className="font-display text-2xl text-foreground sm:text-3xl mt-10 mb-4">Ekibimiz</h2>
        </section>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {EDITORS.map((editor) => (
            <article
              key={editor.name}
              className="atlas-card p-5"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                  {editor.initials}
                </div>
                <div>
                  <h3 className="font-semibold text-base">{editor.name}</h3>
                  <p className="text-xs text-muted-foreground">{editor.role}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                {editor.bio}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {editor.expertise.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center rounded-full bg-primary/5 border border-primary/20 px-2.5 py-0.5 text-xs font-medium text-primary"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>

        <section className="prose prose-slate dark:prose-invert max-w-none">
          <h2 className="font-display text-2xl text-foreground sm:text-3xl mt-12 mb-4">Editöryal İlkelerimiz</h2>
          <div className="not-prose space-y-3">
            {[
              {
                icon: BookOpen,
                title: 'Doğruluk ve Güncellik',
                desc: 'İçerikler mümkün olduğunca resmî ve birincil kaynaklara dayandırılır. Eskiyen bilgiler güncellenir ve "son güncelleme" tarihi belirtilir. Hata bildirimleri dikkate alınır.',
              },
              {
                icon: Shield,
                title: 'Bağımsızlık',
                desc: 'İçeriklerimiz hiçbir finansal kurum, aracı kurum veya şirketten etkilenmez. Sponsorlu içerikler varsa açıkça "Reklam" veya "Sponsorlu" olarak işaretlenir.',
              },
              {
                icon: Users,
                title: 'Şeffaflık',
                desc: 'Veri kaynaklarımız, güncelleme sıklığımız ve olası hatalarda izlediğimiz düzeltme süreci hakkında kullanıcılarımızı bilgilendiririz.',
              },
            ].map((p) => (
              <div key={p.title} className="atlas-card p-4 flex gap-3">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <p.icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-base mb-1">{p.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <h2 className="font-display text-2xl text-foreground sm:text-3xl mt-10 mb-4">İletişim</h2>
          <p>
            Editör ekibimizle iletişime geçmek, içerik önerisi sunmak veya bir hatayı bildirmek için:
          </p>
          <ul>
            <li>
              <a href="mailto:info@finanscozum.net">info@finanscozum.net</a> — Editöryal konular
            </li>
            <li>
              <a href="mailto:info@finanscozum.net">info@finanscozum.net</a> — Genel destek
            </li>
            <li>
              <Link href="/iletisim">İletişim formu</Link>
            </li>
          </ul>
        </section>
      </div>
    </>
  );
}
