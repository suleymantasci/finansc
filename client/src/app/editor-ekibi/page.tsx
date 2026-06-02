import type { Metadata } from 'next';
import { Users, BookOpen, Shield } from 'lucide-react';
import Link from 'next/link';
import { SITE_NAME, SITE_URL } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Editör Ekibi ve Uzman Kadromuz',
  description:
    'FinansÇözüm editör ekibi: Finansal içerik üreticilerimiz, veri analistlerimiz ve editörlerimiz hakkında bilgi.',
  alternates: { canonical: `${SITE_URL}/editor-ekibi` },
  openGraph: {
    title: 'Editör Ekibi | FinansÇözüm',
    description: 'İçerik üreticilerimiz ve uzman kadromuz',
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
    bio: 'Türkiye finans piyasalarını yakından takip eden, makroekonomik gelişmeleri ve piyasa trendlerini düzenli olarak analiz eden editör ekibimiz. TCMB kararları, enflasyon verileri ve borsa gelişmelerini kullanıcılarımıza anlaşılır şekilde aktarır.',
    expertise: ['Makroekonomi', 'Borsa Analizi', 'Altın Piyasası', 'Döviz Piyasası'],
  },
  {
    name: 'Veri ve Analiz Ekibi',
    role: 'Veri Mühendisliği',
    initials: 'VA',
    bio: 'Canlı piyasa verilerinin toplanması, doğrulanması ve platforma entegrasyonundan sorumlu ekibimiz. Birden fazla kaynaktan gelen verileri karşılaştırarak kullanıcılarımıza en doğru ve güncel bilgiyi sunmak için çalışır.',
    expertise: ['Veri Doğrulama', 'API Entegrasyonu', 'Piyasa Verisi', 'Kalite Kontrol'],
  },
  {
    name: 'İçerik Editörleri',
    role: 'Editoryal',
    initials: 'İE',
    bio: 'Blog yazılarımızı, hesaplama araçlarımızı ve rehberlerimizi hazırlayan editörlerimiz. Her içerik yayınlanmadan önce editöryal incelemeden geçer; finansal doğruluk, dil kalitesi ve SEO uyumluluğu kontrol edilir.',
    expertise: ['Finansal Yazarlık', 'SEO', 'Editöryal Süreç', 'İçerik Stratejisi'],
  },
];

export default function EditorEkibiPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    name: 'Editör Ekibi',
    description: 'FinansÇözüm editör ekibi ve uzman kadrosu',
    inLanguage: 'tr-TR',
    isPartOf: { '@id': 'https://finanscozum.net/#website' },
    publisher: { '@id': 'https://finanscozum.net/#organization' },
    mainEntity: {
      '@type': 'Organization',
      '@id': 'https://finanscozum.net/#organization',
      employee: EDITORS.map((e) => ({
        '@type': 'Person',
        name: e.name,
        jobTitle: e.role,
        description: e.bio,
        knowsAbout: e.expertise,
        worksFor: { '@id': 'https://finanscozum.net/#organization' },
      })),
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="mx-auto max-w-5xl px-4 py-12 lg:px-8">
        <header className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <Users className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Editör Ekibimiz</h1>
          </div>
          <p className="text-sm text-muted-foreground">Son güncelleme: 2 Haziran 2026</p>
        </header>

        <section className="prose prose-slate dark:prose-invert max-w-none">
          <p className="lead text-lg text-muted-foreground">
            <strong className="text-foreground">{SITE_NAME}</strong>, Türkiye\'nin finansal bilgi
            ihtiyacını karşılamak için bir araya gelen, kendi alanlarında uzmanlaşmış bir ekip
            tarafından yönetilmektedir. Aşağıda ekibimizin genel yapısı ve uzmanlık alanları
            hakkında bilgi bulabilirsiniz.
          </p>

          <h2 className="text-2xl font-semibold mt-10 mb-4">Ekibimiz</h2>
        </section>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {EDITORS.map((editor) => (
            <article
              key={editor.name}
              className="rounded-xl border border-border bg-card p-5"
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
          <h2 className="text-2xl font-semibold mt-12 mb-4">Editöryal İlkelerimiz</h2>
          <div className="not-prose space-y-3">
            {[
              {
                icon: BookOpen,
                title: 'Doğruluk ve Güncellik',
                desc: 'Her içerik yayınlanmadan önce birden fazla bağımsız kaynaktan doğrulanır. Eskiyen bilgiler güncellenir ve "son güncelleme" tarihi açıkça belirtilir.',
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
              <div key={p.title} className="rounded-lg border border-border bg-card p-4 flex gap-3">
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

          <h2 className="text-2xl font-semibold mt-10 mb-4">İletişim</h2>
          <p>
            Editör ekibimizle iletişime geçmek, içerik önerisi sunmak veya bir hatayı bildirmek için:
          </p>
          <ul>
            <li>
              <a href="mailto:editor@finanscozum.com">editor@finanscozum.com</a> — Editöryal konular
            </li>
            <li>
              <a href="mailto:destek@finanscozum.com">destek@finanscozum.com</a> — Genel destek
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
