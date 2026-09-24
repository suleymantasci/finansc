import { Suspense } from 'react';
import type { Metadata } from 'next';
import { SifreSifirlaClient } from './SifreSifirlaClient';

export const metadata: Metadata = {
  title: 'Şifre Sıfırla',
  robots: { index: false, follow: false },
};

export default function SifreSifirlaPage() {
  return (
    <Suspense>
      <SifreSifirlaClient />
    </Suspense>
  );
}
