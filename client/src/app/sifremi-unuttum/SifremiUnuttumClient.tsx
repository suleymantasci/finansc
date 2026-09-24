'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';

const schema = z.object({
  email: z.string().email('Geçerli bir e-posta giriniz'),
});
type FormData = z.infer<typeof schema>;

export function SifremiUnuttumClient() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setError('');
    setLoading(true);
    try {
      await api.post('/api/auth/forgot-password', data);
      setSent(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'İşlem başarısız';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md atlas-card p-6 lg:p-8">
        <h1 className="font-display text-balance text-4xl text-foreground sm:text-5xl text-center">Şifremi Unuttum</h1>

        {sent ? (
          <div className="mt-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
              <svg className="h-8 w-8 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </div>
            <p className="text-sm text-muted-foreground">Bu e-posta adresi kayıtlıysa birkaç dakika içinde şifre sıfırlama bağlantısı gönderilecek. Bağlantı 30 dakika geçerlidir; gelen kutunuzla birlikte spam klasörünü de kontrol edin.</p>
            <Link href="/giris"><Button variant="outline" className="mt-4">Giriş sayfasına dön</Button></Link>
          </div>
        ) : (
          <>
            <p className="mt-1 text-center text-sm text-muted-foreground">E-posta adresinize sıfırlama bağlantısı göndereceğiz</p>

            {error && <p role="alert" className="mt-4 rounded-lg border border-down/30 bg-down/10 px-4 py-3 text-sm text-down">{error}</p>}

            <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
              <Input label="E-posta" type="email" autoComplete="email" {...register('email')} error={errors.email?.message} />
              <Button type="submit" className="w-full" loading={loading}>Bağlantı Gönder</Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              <Link href="/giris" className="text-primary hover:underline">← Giriş sayfasına dön</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
