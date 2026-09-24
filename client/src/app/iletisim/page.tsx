'use client';

import { useState } from 'react';
import { Mail, MapPin, Clock, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { LEGAL } from '@/lib/legal';

const CONTACT_EMAIL = LEGAL.email;

interface FormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export default function IletisimPage() {
  const [form, setForm] = useState<FormData>({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const update = (k: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [k]: e.target.value }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('idle');
    setErrorMessage('');

    // Basit client-side validasyon (sunucu da validate eder)
    if (!form.name.trim() || !form.email.trim() || !form.subject.trim() || !form.message.trim()) {
      setStatus('error');
      setErrorMessage('Tüm alanlar zorunludur.');
      return;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) {
      setStatus('error');
      setErrorMessage('Geçerli bir e-posta adresi girin.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/api/contact', {
        name: form.name.trim(),
        email: form.email.trim(),
        subject: form.subject.trim(),
        message: form.message.trim(),
      });
      setStatus('success');
      setForm({ name: '', email: '', subject: '', message: '' });
    } catch (err) {
      setStatus('error');
      setErrorMessage(err instanceof Error ? err.message : 'Mesaj gönderilemedi, lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 lg:px-8">
      <h1 className="font-display text-balance text-4xl text-foreground sm:text-5xl mb-6">İletişim</h1>

      <p className="mb-8 text-muted-foreground leading-relaxed">
        Soru, öneri veya geri bildirimleriniz için bizimle iletişime geçebilirsiniz. Size en kısa sürede
        dönüş yapacağız.
      </p>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="flex flex-col items-center atlas-card p-6 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <h2 className="font-display text-2xl text-foreground sm:text-3xl mb-2">E-posta</h2>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="text-sm text-primary hover:underline break-all"
          >
            {CONTACT_EMAIL}
          </a>
        </div>

        <div className="flex flex-col items-center atlas-card p-6 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <MapPin className="h-6 w-6 text-primary" />
          </div>
          <h2 className="font-display text-2xl text-foreground sm:text-3xl mb-2">Adres</h2>
          <p className="text-sm text-muted-foreground">
            {LEGAL.address || 'İstanbul, Türkiye'}
          </p>
        </div>

        <div className="flex flex-col items-center atlas-card p-6 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <Clock className="h-6 w-6 text-primary" />
          </div>
          <h2 className="font-display text-2xl text-foreground sm:text-3xl mb-2">Yanıt</h2>
          <p className="text-sm text-muted-foreground">
            Mesajlara iş günlerinde<br />e-posta ile dönüş yapılır
          </p>
        </div>
      </div>

      <div className="mt-10 atlas-card p-6">
        <h2 className="font-display text-2xl text-foreground sm:text-3xl mb-4">Bize Yazın</h2>

        {status === 'success' && (
          <div className="mb-4 flex items-start gap-2 rounded-lg bg-up/10 px-4 py-3 text-sm text-up">
            <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div>
              <strong>Mesajınız iletildi.</strong> En kısa sürede {CONTACT_EMAIL} üzerinden dönüş yapacağız.
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="mb-4 flex items-start gap-2 rounded-lg bg-down/10 px-4 py-3 text-sm text-down">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div>{errorMessage}</div>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="name" className="mb-1 block text-sm font-medium">
                Ad Soyad
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                disabled={loading}
                value={form.name}
                onChange={update('name')}
                className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
                placeholder="Adınız Soyadınız"
              />
            </div>
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium">
                E-posta
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                disabled={loading}
                value={form.email}
                onChange={update('email')}
                className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
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
              name="subject"
              type="text"
              required
              disabled={loading}
              value={form.subject}
              onChange={update('subject')}
              className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
              placeholder="Konu başlığı"
            />
          </div>
          <div>
            <label htmlFor="message" className="mb-1 block text-sm font-medium">
              Mesaj
            </label>
            <textarea
              id="message"
              name="message"
              rows={5}
              required
              disabled={loading}
              value={form.message}
              onChange={update('message')}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
              placeholder="Mesajınızı yazın..."
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? 'Gönderiliyor...' : 'Gönder'}
          </button>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Formda paylaştığınız ad, e-posta ve mesaj yalnızca talebinizi yanıtlamak için işlenir ve saklanır. Ayrıntı:{' '}
            <Link href="/gizlilik" className="text-primary hover:underline">Gizlilik Politikası ve KVKK Aydınlatma Metni</Link>.
          </p>
        </form>
      </div>
    </div>
  );
}
