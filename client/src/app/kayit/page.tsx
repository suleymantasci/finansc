import type { Metadata } from 'next';
import { KayitClient } from './KayitClient';

export const metadata: Metadata = {
  title: 'Kayıt Ol',
  description: 'FinansCozum hesabı oluşturun.',
};

export default function KayitPage() {
  return <KayitClient />;
}
