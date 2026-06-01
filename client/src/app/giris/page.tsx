import type { Metadata } from 'next';
import { GirisClient } from './GirisClient';

export const metadata: Metadata = {
  title: 'Giriş Yap',
  description: 'FinansCozum hesabınıza giriş yapın.',
};

export default function GirisPage() {
  return <GirisClient />;
}
