import type { Metadata } from 'next';
import { HisselerClient } from './HisselerClient';

export const metadata: Metadata = {
  title: 'Hisse Senetleri | BIST Tüm Hisseler',
  description: "Borsa İstanbul'da (BIST) işlem gören tüm hisse senetlerinin güncel fiyat, alış, satış, en düşük, en yüksek, günlük değişim yüzdesi, hacim ve ciro bilgileri. BIST 30, BIST 50 ve BIST 100 endekslerine göre filtreleme. Hisse detay sayfalarında güncel veriler, sektör karşılaştırması ve FAQ.",
  keywords: ['hisse senedi', 'bist hisseleri', 'borsa hisse fiyatları', 'güncel borsa', 'bist 30', 'bist 100', 'hisse detay'],
  alternates: { canonical: 'https://finanscozum.net/borsa/hisseler' },
  openGraph: {
    title: 'Hisse Senetleri | BIST Tüm Hisseler',
    description: "Borsa İstanbul'da işlem gören tüm hisse senetlerinin güncel fiyat, hacim ve değişim verileri. BIST 30, 50, 100 filtreleme.",
    type: 'website',
    url: 'https://finanscozum.net/borsa/hisseler',
  },
};

export default function HisselerPage() {
  // H1/description HisselerClient içindeki SectionIntro (as="page") tarafından render ediliyor (Pit 11 fix).
  return <HisselerClient />;
}
