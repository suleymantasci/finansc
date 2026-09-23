// ── Altın: sayfa slug'ı ↔ canlı akış adı ↔ geçmiş veri anahtarı ──
// Canlı adlar /api/market/gold, geçmiş anahtarlar /api/history/instruments?kind=gold
// üzerinden doğrulandı (2026-09-24).

export interface GoldEntry {
  slug: string;
  /** Canlı akıştaki birincil ad (öne çıkan fiyat) */
  liveName: string;
  /** Aynı sayfada kaynak tablosunda gösterilecek ek varyantlar */
  variants?: string[];
  /** gold:serbest-piyasa:<historySlug> */
  historySlug: string;
  /** Fiyat para birimi */
  currency: 'TRY' | 'USD';
  /** Çevirici birimi */
  unit: 'gram' | 'adet' | 'ons';
}

export const GOLD_ENTRIES: GoldEntry[] = [
  { slug: 'gram-altin', liveName: 'Gram Altın', historySlug: 'gram-altin', currency: 'TRY', unit: 'gram' },
  { slug: 'has-altin', liveName: 'Gram Has Altın', historySlug: 'has-altin', currency: 'TRY', unit: 'gram' },
  { slug: 'ceyrek-altin', liveName: 'Çeyrek Altın', variants: ['Eski Çeyrek Altın'], historySlug: 'ceyrek-altin', currency: 'TRY', unit: 'adet' },
  { slug: 'yarim-altin', liveName: 'Yarım Altın', variants: ['Eski Yarım Altın'], historySlug: 'yarim-altin', currency: 'TRY', unit: 'adet' },
  { slug: 'tam-altin', liveName: 'Tam Altın', variants: ['Eski Tam Altın'], historySlug: 'tam-altin', currency: 'TRY', unit: 'adet' },
  { slug: 'cumhuriyet-altini', liveName: 'Cumhuriyet Altını', historySlug: 'cumhuriyet-altini', currency: 'TRY', unit: 'adet' },
  { slug: 'ata-altin', liveName: 'Ata Altın', variants: ['Eski Ata Altın'], historySlug: 'ata-altin', currency: 'TRY', unit: 'adet' },
  { slug: 'resat-altin', liveName: 'Reşat Altın', historySlug: 'resat-lira-altin', currency: 'TRY', unit: 'adet' },
  { slug: 'hamit-altin', liveName: 'Hamit Altın', historySlug: 'hamit-altin', currency: 'TRY', unit: 'adet' },
  { slug: 'ikibucuk-altin', liveName: 'İkibuçuk Altın', historySlug: 'ikibucuk-altin', currency: 'TRY', unit: 'adet' },
  { slug: 'besli-altin', liveName: 'Beşli Altın', historySlug: 'besli-altin', currency: 'TRY', unit: 'adet' },
  { slug: 'gremse-altin', liveName: 'Gremse Altın', variants: ['Eski Gremse Altın'], historySlug: 'gremse-altin', currency: 'TRY', unit: 'adet' },
  { slug: 'bilezik', liveName: '22 Ayar Bilezik', variants: ['22 Ayar Eski Bilezik (Toptan)'], historySlug: '22-ayar-bilezik', currency: 'TRY', unit: 'gram' },
  { slug: '18-ayar-altin', liveName: '18 Ayar Bilezik', historySlug: '18-ayar-altin', currency: 'TRY', unit: 'gram' },
  { slug: '14-ayar-altin', liveName: '14 Ayar Bilezik', historySlug: '14-ayar-altin', currency: 'TRY', unit: 'gram' },
  { slug: 'ons-altin', liveName: 'Ons Altın', historySlug: 'ons-altin', currency: 'USD', unit: 'ons' },
  { slug: 'gumus', liveName: 'Gram Gümüş', historySlug: 'gumus', currency: 'TRY', unit: 'gram' },
];

export const GOLD_BY_SLUG: Record<string, GoldEntry> = Object.fromEntries(GOLD_ENTRIES.map((g) => [g.slug, g]));

export const goldHistoryKey = (g: GoldEntry) => `gold:serbest-piyasa:${g.historySlug}`;
