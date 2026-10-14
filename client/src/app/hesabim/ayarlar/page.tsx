'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/auth.store';
import { api } from '@/lib/api';
import type { AuthUser } from '@/types';

const profileSchema = z.object({
  firstName: z.string().min(2, 'Ad en az 2 karakter olmalı'),
  lastName: z.string().min(2, 'Soyad en az 2 karakter olmalı'),
  phone: z.string().optional(),
  city: z.string().optional(),
  birthDate: z.string().optional(),
  gender: z.string().optional(),
});
type ProfileData = z.infer<typeof profileSchema>;

const passwordSchema = z.object({
  currentPassword: z.string().min(6, 'Mevcut şifrenizi giriniz'),
  newPassword: z.string().min(8, 'Yeni şifre en az 8 karakter olmalı'),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'Şifreler eşleşmiyor',
  path: ['confirmPassword'],
});
type PasswordData = z.infer<typeof passwordSchema>;

export default function AyarlarPage() {
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);

  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  const profileForm = useForm<ProfileData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      phone: user?.phone || '',
      city: user?.city || '',
      birthDate: user?.birthDate || '',
      gender: user?.gender || '',
    },
  });

  const passwordForm = useForm<PasswordData>({
    resolver: zodResolver(passwordSchema),
  });

  const onProfileSubmit = async (data: ProfileData) => {
    setProfileSuccess(false);
    setProfileError('');
    setProfileLoading(true);
    try {
      const updated = await api.patch<Partial<AuthUser>>('/api/auth/profile', data);
      updateUser(updated);
      setProfileSuccess(true);
    } catch (err: unknown) {
      setProfileError(err instanceof Error ? err.message : 'Güncelleme başarısız');
    } finally {
      setProfileLoading(false);
    }
  };

  const onPasswordSubmit = async (data: PasswordData) => {
    setPasswordSuccess(false);
    setPasswordError('');
    setPasswordLoading(true);
    try {
      await api.post('/api/auth/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      setPasswordSuccess(true);
      passwordForm.reset();
    } catch (err: unknown) {
      setPasswordError(err instanceof Error ? err.message : 'Şifre değiştirme başarısız');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Profile */}
      <section>
        <h1 className="font-display text-balance text-4xl text-foreground sm:text-5xl">Ayarlar</h1>
        <p className="mt-1 text-sm text-muted-foreground">Profil bilgilerinizi ve güvenlik ayarlarınızı yönetin</p>

        <div className="mt-6 atlas-card p-5">
          <h2 className="font-display text-2xl text-foreground sm:text-3xl">Profil Bilgileri</h2>

          {profileSuccess && <div className="mt-3 rounded-lg bg-success/10 px-4 py-3 text-sm text-success">Profil güncellendi</div>}
          {profileError && <div className="mt-3 rounded-lg bg-down/10 px-4 py-3 text-sm text-down">{profileError}</div>}

          <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input label="Ad" {...profileForm.register('firstName')} error={profileForm.formState.errors.firstName?.message} />
              <Input label="Soyad" {...profileForm.register('lastName')} error={profileForm.formState.errors.lastName?.message} />
            </div>
            <Input label="Telefon" type="tel" {...profileForm.register('phone')} />
            <Input label="Şehir" {...profileForm.register('city')} />
            <Input label="Doğum Tarihi" type="date" {...profileForm.register('birthDate')} />
            <div>
              <label className="mb-1 block text-sm font-medium">Cinsiyet</label>
              <select {...profileForm.register('gender')} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
                <option value="">Belirtmek istemiyorum</option>
                <option value="male">Erkek</option>
                <option value="female">Kadın</option>
                <option value="other">Diğer</option>
              </select>
            </div>
            <Button type="submit" loading={profileLoading}>Kaydet</Button>
          </form>
        </div>
      </section>

      {/* Password */}
      <section className="atlas-card p-5">
        <h2 className="font-display text-2xl text-foreground sm:text-3xl">Şifre Değiştir</h2>

        {passwordSuccess && <div className="mt-3 rounded-lg bg-success/10 px-4 py-3 text-sm text-success">Şifre değiştirildi</div>}
        {passwordError && <div className="mt-3 rounded-lg bg-down/10 px-4 py-3 text-sm text-down">{passwordError}</div>}

        <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="mt-4 space-y-4">
          <Input label="Mevcut Şifre" type="password" {...passwordForm.register('currentPassword')} error={passwordForm.formState.errors.currentPassword?.message} />
          <Input label="Yeni Şifre" type="password" {...passwordForm.register('newPassword')} error={passwordForm.formState.errors.newPassword?.message} />
          <Input label="Yeni Şifre Tekrar" type="password" {...passwordForm.register('confirmPassword')} error={passwordForm.formState.errors.confirmPassword?.message} />
          <Button type="submit" loading={passwordLoading}>Şifreyi Değiştir</Button>
        </form>
      </section>
    </div>
  );
}
