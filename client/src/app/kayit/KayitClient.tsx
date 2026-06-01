'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/auth.store';
import { api } from '@/lib/api';
import type { AuthUser, AuthTokens } from '@/types';

const schema = z.object({
  firstName: z.string().min(2, 'Ad en az 2 karakter olmalı'),
  lastName: z.string().min(2, 'Soyad en az 2 karakter olmalı'),
  email: z.string().email('Geçerli bir e-posta giriniz'),
  password: z.string().min(6, 'Şifre en az 6 karakter olmalı'),
  confirmPassword: z.string(),
  terms: z.literal(true, { errorMap: () => ({ message: 'Kullanım şartlarını kabul etmelisiniz' }) }),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Şifreler eşleşmiyor',
  path: ['confirmPassword'],
});
type FormData = z.infer<typeof schema>;

export function KayitClient() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setError('');
    setLoading(true);
    try {
      const res = await api.post<{ user: AuthUser; accessToken: string; refreshToken: string }>('/api/auth/register', {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
      });
      setAuth(res.user, res.accessToken, res.refreshToken);
      router.push('/hesabim');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Kayıt başarısız';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 lg:p-8">
        <h1 className="text-center text-2xl font-bold">Kayıt Ol</h1>
        <p className="mt-1 text-center text-sm text-muted-foreground">Ücretsiz hesap oluşturun</p>

        {error && (
          <div className="mt-4 rounded-lg bg-danger/10 px-4 py-3 text-sm text-danger">{error}</div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Ad" {...register('firstName')} error={errors.firstName?.message} />
            <Input label="Soyad" {...register('lastName')} error={errors.lastName?.message} />
          </div>
          <Input label="E-posta" type="email" autoComplete="email" {...register('email')} error={errors.email?.message} />
          <Input label="Şifre" type="password" autoComplete="new-password" {...register('password')} error={errors.password?.message} />
          <Input label="Şifre Tekrar" type="password" autoComplete="new-password" {...register('confirmPassword')} error={errors.confirmPassword?.message} />

          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" {...register('terms')} className="mt-0.5 rounded border-border" />
            <span className="text-muted-foreground">
              <Link href="/kullanim-sartlari" className="text-primary hover:underline">Kullanım şartlarını</Link> ve{' '}
              <Link href="/gizlilik-politikasi" className="text-primary hover:underline">gizlilik politikasını</Link> okudum ve kabul ediyorum.
            </span>
          </label>
          {errors.terms && <p className="text-xs text-danger">{errors.terms.message}</p>}

          <Button type="submit" className="w-full" loading={loading}>Kayıt Ol</Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Zaten hesabınız var mı?{' '}
          <Link href="/giris" className="text-primary hover:underline">Giriş Yap</Link>
        </p>
      </div>
    </div>
  );
}
