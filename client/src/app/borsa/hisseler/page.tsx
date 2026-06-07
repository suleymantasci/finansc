import type { Metadata } from 'next';
import { HisselerClient } from './HisselerClient';

export const metadata: Metadata = {
  title: 'Hisse Senetleri',
  description: 'Tüm BIST hisselerini anlık takip edin. Sembol, fiyat, değişim, hacim ve ciro bilgileri canlı olarak güncellenir.',
  keywords: ['hisse senedi', 'bist hisseleri', 'borsa hisse fiyatları', 'canlı hisse'],
  alternates: { canonical: 'https://finanscozum.net/borsa/hisseler' },
};

export default function HisselerPage() {
  return (
    <>
      {/* Server-rendered H1 (Pit 11 fix) */}
      <section className="mx-auto max-w-7xl px-4 pt-6 lg:px-8">
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
          BIST Hisse Senetleri — Anlık Fiyat ve Analiz
        </h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-3xl">
          Borsa İstanbul&apos;da işlem gören tüm hisselerin anlık fiyat, değişim, hacim ve ciro
          verileri. Her hisse için detaylı analiz, sektör karşılaştırması ve günlük yorum.
        </p>
      </section>
      <HisselerClient />
    </>
  );
}
