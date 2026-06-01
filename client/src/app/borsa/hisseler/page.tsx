import type { Metadata } from 'next';
import { HisselerClient } from './HisselerClient';

export const metadata: Metadata = {
  title: 'Hisse Senetleri',
  description: 'Tüm BIST hisselerini anlık takip edin. Sembol, fiyat, değişim, hacim ve ciro bilgileri canlı olarak güncellenir.',
  keywords: ['hisse senedi', 'bist hisseleri', 'borsa hisse fiyatları', 'canlı hisse'],
};

export default function HisselerPage() {
  return <HisselerClient />;
}
