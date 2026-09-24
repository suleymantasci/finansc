'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  email: z.string().email('Geçerli bir e-posta giriniz'),
  password: z.string().min(6, 'Şifre en az 6 karakter olmalı'),
});
type FormData = z.infer<typeof schema>;

// Open-redirect koruması: from sadece internal path olabilir.
// - mutlak URL'ler (http://, https://, //, javascript:, data:) reject
// - sadece "/" ile başlayan internal path'ler kabul
// - aksi halde ana sayfaya yönlendir
function safeRedirectTarget(raw: string | null | undefined): string {
  const fallback = '/';
  if (!raw) return fallback;
  // decode et ama sadece path kısmını al
  let decoded: string;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    return fallback;
  }
  // Sadece internal path
  if (!decoded.startsWith('/')) return fallback;
  // "//xxx" protocol-relative URL olamaz
  if (decoded.startsWith('//')) return fallback;
  // "/\xxx" backslash'li bypass da olamaz
  if (decoded.startsWith('/\\')) return fallback;
  return decoded;
}

export function GirisClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
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
      const res = await api.post<{ user: AuthUser; accessToken: string; refreshToken: string }>('/api/auth/login', data);
      setAuth(res.user, res.accessToken, res.refreshToken);
      // ?from=... varsa oraya (güvenli path), yoksa ana sayfaya
      const target = safeRedirectTarget(searchParams?.get('from'));
      router.push(target);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Giriş başarısız';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md atlas-card p-6 lg:p-8">
        <h1 className="font-display text-balance text-4xl text-foreground sm:text-5xl text-center">Giriş Yap</h1>
        <p className="mt-1 text-center text-sm text-muted-foreground">Hesabınıza giriş yapın</p>

        {error && (
          <div className="mt-4 rounded-lg bg-down/10 px-4 py-3 text-sm text-down">{error}</div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <Input label="E-posta" type="email" autoComplete="email" {...register('email')} error={errors.email?.message} />
          <Input label="Şifre" type="password" autoComplete="current-password" {...register('password')} error={errors.password?.message} />

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" className="rounded border-border" />
              <span className="text-muted-foreground">Beni hatırla</span>
            </label>
            <Link href="/sifremi-unuttum" className="text-primary hover:underline">Şifremi unuttum</Link>
          </div>

          <Button type="submit" className="w-full" loading={loading}>Giriş Yap</Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Hesabınız yok mu?{' '}
          <Link href="/kayit" className="text-primary hover:underline">Kayıt Ol</Link>
        </p>
      </div>
    </div>
  );
}
