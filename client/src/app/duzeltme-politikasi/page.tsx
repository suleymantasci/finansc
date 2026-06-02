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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="mx-auto max-w-4xl px-4 py-12 lg:px-8">
        <header className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <FileEdit className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Düzeltme Politikası</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Son güncelleme: 2 Haziran 2026
          </p>
        </header>

        <section className="prose prose-slate dark:prose-invert max-w-none">
          <p className="lead text-lg text-muted-foreground">
            Finansal verilerin doğruluğu hayati önem taşır. {`FinansÇözüm`} olarak herhangi bir veri
            hatası, içerik yanlışı veya güncelleme gecikmesi tespit ettiğimizde izlediğimiz süreç
            aşağıdadır.
          </p>

          <h2 className="text-2xl font-semibold mt-10 mb-4">1. Hata Tespiti</h2>
          <p>Hatalar aşağıdaki kanallardan tespit edilir:</p>
          <ul className="space-y-2 mt-3">
            <li>
              <CheckCircle2 className="inline h-4 w-4 mr-1.5 text-emerald-500" />
              <strong>Otomatik monitoring:</strong> Kaynak API'lerden gelen veriler çapraz kontrol
              edilir; uyuşmazlık olursa alarm tetiklenir
            </li>
            <li>
              <CheckCircle2 className="inline h-4 w-4 mr-1.5 text-emerald-500" />
              <strong>Kullanıcı bildirimi:</strong> Ziyaretçilerimizin{' '}
              <a href="mailto:editor@finanscozum.com">editor@finanscozum.com</a> üzerinden
              bildirdiği hatalar
            </li>
            <li>
              <CheckCircle2 className="inline h-4 w-4 mr-1.5 text-emerald-500" />
              <strong>İç denetim:</strong> Editör ekibinin rutin içerik gözden geçirmeleri
            </li>
            <li>
              <CheckCircle2 className="inline h-4 w-4 mr-1.5 text-emerald-500" />
              <strong>Kaynak değişikliği:</strong> Veri sağlayıcıların yaptığı güncellemeler
            </li>
          </ul>

          <h2 className="text-2xl font-semibold mt-10 mb-4">2. Düzeltme Süreci</h2>
          <div className="not-prose space-y-3 mt-4">
            {[
              {
                step: 'Aşama 1 — Doğrulama',
                desc: 'Bildirilen hata editör ekibi tarafından bağımsız kaynaklardan doğrulanır. Hata teyit edilmezse bildirim yapan kişiye geri dönüş yapılır.',
                time: '2-4 saat',
                icon: AlertCircle,
              },
              {
                step: 'Aşama 2 — Düzeltme',
                desc: 'Veri kaynağındaki sorun tespit edilir ve düzeltilir. Kod tarafında otomatik düzeltme yapılamıyorsa manuel müdahale uygulanır.',
                time: '4-12 saat',
                icon: FileEdit,
              },
              {
                step: 'Aşama 3 — Yayın ve Bildirim',
                desc: 'Düzeltme yapıldıktan sonra etkilenen sayfa/sayfalar güncellenir, son güncelleme tarihi notu eklenir ve kullanıcıya geri bildirim verilir.',
                time: '12-24 saat',
                icon: CheckCircle2,
              },
              {
                step: 'Aşama 4 — Kök Neden Analizi',
                desc: 'Hatanın tekrarlamaması için kök neden analizi yapılır; monitoring veya kaynak entegrasyonunda iyileştirmeler uygulanır.',
                time: '1-7 gün',
                icon: Clock,
              },
            ].map(({ step, desc, time, icon: Icon }) => (
              <div key={step} className="rounded-lg border border-border bg-card p-4">
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

          <h2 className="text-2xl font-semibold mt-10 mb-4">3. Şeffaflık Taahhüdü</h2>
          <p>
            Önemli veri hataları (örneğin bir endeksin yanlış gösterilmesi, döviz kurunda saatlerce
            süren sapma, kaynak erişim kesintisi) durumunda:
          </p>
          <ul className="space-y-1.5 mt-3">
            <li>Etkilenen sayfalarda görünür "Düzeltme notu" gösterilir</li>
            <li>İlgili blog yazılarında güncelleme tarihi notu eklenir</li>
            <li>Ana sayfada durum bildirimi yayınlanır (kritik durumlarda)</li>
            <li>Kullanıcıya (bildirim yaptıysa) e-posta ile geri dönüş yapılır</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-10 mb-4">4. İçerik Güncellemeleri</h2>
          <p>
            Blog yazıları ve rehberler için: güncellenen bölümler içeriğin sonunda "Güncelleme
            geçmişi" bölümünde belirtilir. Maddeyi değiştiren editör, tarih ve değişiklik açıklaması
            görünür şekilde paylaşılır.
          </p>
        </section>
      </div>
    </>
  );
}
