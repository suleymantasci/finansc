// Blog kategori anahtarı → görünen ad (DB'de küçük harf anahtar tutuluyor)
export const BLOG_CATEGORY_LABELS: Record<string, string> = {
  altin: 'Altın',
  borsa: 'Borsa',
  hisse: 'Hisse',
  doviz: 'Döviz',
  kredi: 'Kredi',
  tasarruf: 'Tasarruf',
  emeklilik: 'Emeklilik',
  yatirim: 'Yatırım',
  sigorta: 'Sigorta',
  vergi: 'Vergi',
  emlak: 'Emlak',
  ekonomi: 'Ekonomi',
  kripto: 'Kripto',
  'kredi-karti': 'Kredi kartı',
};

export const categoryLabel = (c?: string | null) => (c ? BLOG_CATEGORY_LABELS[c] ?? c.charAt(0).toLocaleUpperCase('tr-TR') + c.slice(1) : null);
