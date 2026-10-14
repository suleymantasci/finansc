'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';

const schema = z
  .object({
    newPassword: z.string().min(8, 'En az 8 karakter').max(128),
    confirm: z.string(),
  })
  .refine((d) => d.newPassword === d.confirm, { message: 'Şifreler eşleşmiyor', path: ['confirm'] });

type FormData = z.infer<typeof schema>;

export function SifreSifirlaClient() {
  const token = useSearchParams().get('token') ?? '';
  const validToken = /^[a-f0-9]{64}$/.test(token);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setError('');
    setLoading(true);
    try {
      await api.post('/api/auth/reset-password', { token, newPassword: data.newPassword });
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'İşlem başarısız');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[60dvh] items-center justify-center px-4 py-12">
      <div className="atlas-card w-full max-w-md p-6 lg:p-8">
        <p className="eyebrow text-center text-primary">Hesap</p>
        <h1 className="font-display mt-2 text-center text-4xl text-foreground">Yeni şifre</h1>

        {!validToken ? (
          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>Bu bağlantı geçersiz. Lütfen şifre sıfırlama isteğini yeniden gönderin.</p>
            <Link href="/sifremi-unuttum" className="mt-4 inline-block font-medium text-primary hover:underline">
              Şifremi unuttum
            </Link>
          </div>
        ) : done ? (
          <div className="mt-6 text-center text-sm text-muted-foreground" role="status">
            <p>Şifreniz güncellendi. Güvenliğiniz için tüm cihazlardaki oturumlarınız kapatıldı.</p>
            <Link href="/giris">
              <Button className="mt-5">Giriş yap</Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
            {error && (
              <p role="alert" className="rounded-lg border border-down/30 bg-down/10 px-4 py-3 text-sm text-down">
                {error}
              </p>
            )}
            <Input label="Yeni şifre" type="password" autoComplete="new-password" {...register('newPassword')} error={errors.newPassword?.message} />
            <Input label="Yeni şifre (tekrar)" type="password" autoComplete="new-password" {...register('confirm')} error={errors.confirm?.message} />
            <Button type="submit" className="w-full" loading={loading}>
              Şifreyi güncelle
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
