import type { Metadata } from 'next';
import { SifremiUnuttumClient } from './SifremiUnuttumClient';

export const metadata: Metadata = {
  title: 'Şifremi Unuttum',
  description: 'Şifrenizi sıfırlamak için e-posta adresinizi girin.',
};

export default function SifremiUnuttumPage() {
  return <SifremiUnuttumClient />;
}
