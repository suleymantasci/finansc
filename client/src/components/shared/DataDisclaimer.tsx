// Veri gecikmesi/kaynak uyarısı — paylaşılan küçük punto bilgi kutusu.
// Borsa için BIST 15dk gecikmeli yasal uyarısı, altın/döviz için kaynak
// bilgisi. Server component — her sayfada SSR'lenir (initial HTML'de
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
    title: 'Veri gecikmesi (15 dakika)',
    body: 'Burada gösterilen Borsa İstanbul hisse ve endeks fiyatları, BISTECH Veri Dağıtım Sistemi kapsamında 15 dakika gecikmeli olarak iletilmektedir. Veriler bilgi amaçlıdır, yatırım tavsiyesi niteliği taşımaz. Kaynak: Borsa İstanbul A.Ş.',
  },
  altin: {
    title: 'Veri kaynağı',
    body: 'Altın fiyatları serbest piyasa, Kapalıçarşı, Harem Altın, Altınkaynak, Garanti BBVA ve Akbank kaynaklarından derlenir. Fiyatlar bilgi amaçlıdır, yatırım tavsiyesi niteliği taşımaz.',
  },
  doviz: {
    title: 'Veri kaynağı',
    body: 'Döviz kurları serbest piyasa ve Türkiye Cumhuriyet Merkez Bankası kaynaklarından derlenir. Fiyatlar bilgi amaçlıdır, yatırım tavsiyesi niteliği taşımaz.',
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
