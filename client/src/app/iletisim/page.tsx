import type { Metadata } from 'next';
import { Mail, MapPin, Clock } from 'lucide-react';

export const metadata: Metadata = {
  title: 'İletişim | FinansCozum',
  description: 'FinansCozum ile iletişime geçin. Soru, öneri, geri bildirim ve editör talepleriniz için e-posta, iletişim formu ve çalışma saatleri.',
  keywords: ['iletişim', 'editör', 'geri bildirim', 'destek', 'finanscozum iletişim'],
  alternates: { canonical: 'https://finanscozum.net/iletisim' },
};

export default function IletisimPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 lg:px-8">
      <h1 className="mb-6 text-3xl font-bold">İletişim</h1>

      <p className="mb-8 text-muted-foreground leading-relaxed">
        Soru, öneri veya geri bildirimleriniz için bizimle iletişime geçebilirsiniz. Size en kısa sürede
        dönüş yapacağız.
      </p>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="flex flex-col items-center rounded-xl border border-border bg-card p-6 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <h2 className="mb-2 font-semibold">E-posta</h2>
          <a
            href="mailto:info@finanscozum.com"
            className="text-sm text-primary hover:underline"
          >
            info@finanscozum.com
          </a>
        </div>

        <div className="flex flex-col items-center rounded-xl border border-border bg-card p-6 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <MapPin className="h-6 w-6 text-primary" />
          </div>
          <h2 className="mb-2 font-semibold">Adres</h2>
          <p className="text-sm text-muted-foreground">
            İstanbul, Türkiye
          </p>
        </div>

        <div className="flex flex-col items-center rounded-xl border border-border bg-card p-6 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <Clock className="h-6 w-6 text-primary" />
          </div>
          <h2 className="mb-2 font-semibold">Çalışma Saatleri</h2>
          <p className="text-sm text-muted-foreground">
            Pazartesi – Cuma<br />09:00 – 18:00
          </p>
        </div>
      </div>

      <div className="mt-10 rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 text-xl font-semibold">Bize Yazın</h2>
        <form className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="name" className="mb-1 block text-sm font-medium">
                Ad Soyad
              </label>
              <input
                id="name"
                type="text"
                className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Adınız Soyadınız"
              />
            </div>
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium">
                E-posta
              </label>
              <input
                id="email"
                type="email"
                className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="ornek@mail.com"
              />
            </div>
          </div>
          <div>
            <label htmlFor="subject" className="mb-1 block text-sm font-medium">
              Konu
            </label>
            <input
              id="subject"
              type="text"
              className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Konu başlığı"
            />
          </div>
          <div>
            <label htmlFor="message" className="mb-1 block text-sm font-medium">
              Mesaj
            </label>
            <textarea
              id="message"
              rows={5}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Mesajınızı yazın..."
            />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Gönder
          </button>
        </form>
      </div>
    </div>
  );
}
