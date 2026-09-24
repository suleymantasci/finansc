import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/constants';

// Sayfa istemci bileşeni olduğu için metadata burada
export const metadata: Metadata = {
  title: 'İletişim',
  description: 'FinansÇözüm ile iletişime geçin: öneri, düzeltme talebi ve iş birliği için mesaj gönderin veya info@finanscozum.net adresine yazın.',
  alternates: { canonical: `${SITE_URL}/iletisim` },
};

export default function IletisimLayout({ children }: { children: React.ReactNode }) {
  return children;
}
