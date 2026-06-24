import type { Metadata } from 'next';
import { Suspense } from 'react';
import { GirisClient } from './GirisClient';

export const metadata: Metadata = {
  title: 'Giriş Yap',
  description: 'FinansCozum hesabınıza giriş yapın.',
};

export default function GirisPage() {
  // GirisClient useSearchParams kullanıyor → Suspense boundary zorunlu
  // (Next.js 16: CSR bailout hatası önlemek için)
  return (
    <Suspense fallback={null}>
      <GirisClient />
    </Suspense>
  );
}
