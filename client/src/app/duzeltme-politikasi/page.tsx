import { safeJsonLd } from '@/lib/json-ld';
import type { Metadata } from 'next';
import { CheckCircle2, AlertCircle, Clock, FileEdit } from 'lucide-react';
import { SITE_URL } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Düzeltme Politikası',
  description:
    'FinansÇözüm düzeltme politikası: Finansal verilerdeki veya içeriklerdeki hataları nasıl tespit edip düzelttiğimizi açıklıyoruz.',
  alternates: { canonical: `${SITE_URL}/duzeltme-politikasi` },
};

export default function DuzeltmePolitikasiPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Düzeltme Politikası',
    description: 'FinansÇözüm düzeltme politikası ve hata yönetimi',
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
            <FileEdit className="h-8 w-8 text-primary" />
            <h1 className="font-display text-balance text-4xl text-foreground sm:text-5xl">Düzeltme Politikası</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Son güncelleme: 24 Eylül 2026
          </p>
        </header>

        <section className="prose prose-slate dark:prose-invert max-w-none">
          <p className="lead text-lg text-muted-foreground">
            Finansal verilerin doğruluğu hayati önem taşır. {`FinansÇözüm`} olarak herhangi bir veri
            hatası, içerik yanlışı veya güncelleme gecikmesi tespit ettiğimizde izlediğimiz süreç
            aşağıdadır.
          </p>

          <h2 className="font-display text-2xl text-foreground sm:text-3xl mt-10 mb-4">1. Hata Tespiti</h2>
          <p>Hatalar aşağıdaki kanallardan tespit edilir:</p>
          <ul className="space-y-2 mt-3">
            <li>
              <CheckCircle2 className="inline h-4 w-4 mr-1.5 text-emerald-500" />
              <strong>Otomatik kayıt:</strong> Veri toplama hataları sistem kayıtlarına yazılır; bir kaynağa
              ulaşılamazsa son bilinen değer, ait olduğu saatle birlikte gösterilir
            </li>
            <li>
              <CheckCircle2 className="inline h-4 w-4 mr-1.5 text-emerald-500" />
              <strong>Kullanıcı bildirimi:</strong> Ziyaretçilerimizin{' '}
              <a href="mailto:info@finanscozum.net">info@finanscozum.net</a> üzerinden
              bildirdiği hatalar
            </li>
            <li>
              <CheckCircle2 className="inline h-4 w-4 mr-1.5 text-emerald-500" />
              <strong>Gözden geçirme:</strong> Eskiyen oran, tutar ve mevzuat bilgilerinin güncellenmesi
            </li>
            <li>
              <CheckCircle2 className="inline h-4 w-4 mr-1.5 text-emerald-500" />
              <strong>Kaynak değişikliği:</strong> Veri sağlayıcıların yaptığı güncellemeler
            </li>
          </ul>

          <h2 className="font-display text-2xl text-foreground sm:text-3xl mt-10 mb-4">2. Düzeltme Süreci</h2>
          <div className="not-prose space-y-3 mt-4">
            {[
              {
                step: 'Aşama 1 — Doğrulama',
                desc: 'Bildirilen hata, verinin kaynağı ve ilgili resmî yayınla karşılaştırılarak kontrol edilir. Hata teyit edilmezse bildirim yapan kişiye gerekçesiyle dönüş yapılır.',
                time: 'Hedef: 2 iş günü',
                icon: AlertCircle,
              },
              {
                step: 'Aşama 2 — Düzeltme',
                desc: 'Veri kaynağındaki sorun tespit edilir ve düzeltilir. Kod tarafında otomatik düzeltme yapılamıyorsa manuel müdahale uygulanır.',
                time: 'Hedef: 5 iş günü',
                icon: FileEdit,
              },
              {
                step: 'Aşama 3 — Yayın ve Bildirim',
                desc: 'Düzeltme yapıldıktan sonra etkilenen sayfa/sayfalar güncellenir, son güncelleme tarihi notu eklenir ve kullanıcıya geri bildirim verilir.',
                time: 'Düzeltmeyle birlikte',
                icon: CheckCircle2,
              },
              {
                step: 'Aşama 4 — Kök Neden Analizi',
                desc: 'Hatanın tekrarlamaması için kök neden analizi yapılır; monitoring veya kaynak entegrasyonunda iyileştirmeler uygulanır.',
                time: 'Gerektiğinde',
                icon: Clock,
              },
            ].map(({ step, desc, time, icon: Icon }) => (
              <div key={step} className="atlas-card p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-semibold text-base">{step}</h3>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">{time}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <h2 className="font-display text-2xl text-foreground sm:text-3xl mt-10 mb-4">3. Şeffaflık Taahhüdü</h2>
          <p>
            Önemli veri hataları (örneğin bir endeksin yanlış gösterilmesi, döviz kurunda saatlerce
            süren sapma, kaynak erişim kesintisi) durumunda:
          </p>
          <ul className="space-y-1.5 mt-3">
            <li>Hata düzeltilir; gerekiyorsa ilgili yazıya düzeltme notu eklenir</li>
            <li>İlgili yazının "güncellendi" tarihi yenilenir</li>
            <li>Bildirimi yapan kişiye (iletişim bilgisi varsa) e-posta ile dönüş yapılır</li>
          </ul>

          <h2 className="font-display text-2xl text-foreground sm:text-3xl mt-10 mb-4">4. İçerik Güncellemeleri</h2>
          <p>
            Blog yazıları ve rehberler güncellendiğinde yazının başındaki "güncellendi" tarihi yenilenir.
            Anlamı değiştiren önemli düzeltmelerde yazıya kısa bir düzeltme notu eklenir.
          </p>
        </section>
      </div>
    </>
  );
}
