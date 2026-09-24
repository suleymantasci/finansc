// Veri gecikmesi/kaynak uyarısı — paylaşılan küçük punto bilgi kutusu.
// Borsa için gecikme uyarısı, altın/döviz için kaynak bilgisi. Lisans veya
// ortaklık iddiası içermemeli (bkz. docs/hukuk/RAPOR.md). Server component — her sayfada SSR'lenir (initial HTML'de
// görünür, SEO ve kullanıcı güveni için kritik).
//
// Kullanım:
//   <DataDisclaimer variant="borsa" />    → BIST 15dk gecikmeli
//   <DataDisclaimer variant="altin" />    → Altın kaynak bilgisi
//   <DataDisclaimer variant="doviz" />    → Döviz kaynak bilgisi

import { Info } from 'lucide-react';

type Variant = 'borsa' | 'altin' | 'doviz';

const COPY: Record<Variant, { title: string; body: string }> = {
  borsa: {
    title: 'Veri gecikmesi (en az 15 dakika)',
    body: 'Borsa İstanbul hisse ve endeks fiyatları kamuya açık kaynaklardan derlenir ve en az 15 dakika gecikmelidir. FinansÇözüm, Borsa İstanbul A.Ş. ile bağlantılı değildir. Veriler bilgi amaçlıdır, yatırım tavsiyesi niteliği taşımaz.',
  },
  altin: {
    title: 'Veri kaynağı',
    body: 'Altın fiyatları serbest piyasa, Kapalıçarşı, Harem Altın, Altınkaynak, Garanti BBVA ve Akbank piyasalarının kamuya açık fiyat yayınlarından derlenir; bu kurumlarla bir ortaklığımız yoktur. Fiyatlar gecikmeli olabilir, bilgi amaçlıdır ve yatırım tavsiyesi niteliği taşımaz.',
  },
  doviz: {
    title: 'Veri kaynağı',
    body: 'Döviz kurları serbest piyasa yayınlarından ve Türkiye Cumhuriyet Merkez Bankası’ndan derlenir. Fiyatlar gecikmeli olabilir, bilgi amaçlıdır ve yatırım tavsiyesi niteliği taşımaz.',
  },
};

export function DataDisclaimer({ variant }: { variant: Variant }) {
  const c = COPY[variant];
  return (
    <div
      role="note"
      aria-label={c.title}
      className="mb-4 flex items-start gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground"
    >
      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <p className="leading-relaxed">
        <span className="font-semibold text-foreground">{c.title}.</span> {c.body}
      </p>
    </div>
  );
}
