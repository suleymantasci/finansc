// ── Altın Miktar Programmatic SEO Verisi ──
// Bigpara modeli: 0.05-1000 gram arası tüm gramajlar için sayfa üretir

export interface GramAmount {
  // URL slug: 0.05 → "0-05", 1.5 → "1-5", 100 → "100"
  slug: string;
  // Görüntülenecek miktar (gram)
  grams: number;
  // URL path: /altin/miktar/0-05-gram
  path: string;
  title: string;
  description: string;
}

// Miktar etiketleri (Türkçe'de yaygın kullanım)
const GRAM_LABELS: Record<number, string> = {
  0.05: 'yarım gram',
  0.1: 'bir gramın onda biri',
  0.25: 'çeyrek gram',
  0.5: 'yarım gram',
  1: 'bir gram',
  2.5: 'iki buçuk gram',
  5: 'beş gram',
  10: 'on gram',
  25: 'yirmi beş gram',
  50: 'elli gram',
  100: 'yüz gram (1 çeyrek kilo)',
  250: 'iki yüz elli gram (yarım kilo)',
  500: 'beş yüz gram',
  1000: 'bin gram (1 kilo)',
};

// Üretilen gramaj listesi (template)
function generateGramAmounts(): GramAmount[] {
  const amounts: number[] = [];

  // Çok küçük miktarlar
  [0.05, 0.1, 0.25, 0.5, 1, 2, 2.5, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000].forEach(
    (n) => amounts.push(n)
  );
  return amounts.map((grams) => {
    // Slug: 0.05 → "0-05-gram", 1 → "1-gram", 1000 → "1000-gram"
    // URL path ile slug aynı ki getGramAmount eşleşsin
    const slug = `${grams.toString().replace('.', '-')}-gram`;
    const label = GRAM_LABELS[grams] || `${grams} gram`;
    return {
      slug,
      grams,
      path: `/altin/miktar/${slug}`,
      title: `${label.charAt(0).toLocaleUpperCase('tr-TR') + label.slice(1)} altın kaç TL? (${grams} gr güncel fiyat)`,
      description: `${label} (${grams} gram) altının güncel TL fiyatı, kaynaklara göre alış-satış, günlük değişim ve gram altının 1 aylık grafiği.`,
    };
  });
}

export const GRAM_AMOUNTS: GramAmount[] = generateGramAmounts();

// ─────────────────────────────────────────────────────────────
// ── Adet Programmatic: x adet çeyrek/tam/cumhuriyet/ata ──
// ─────────────────────────────────────────────────────────────

export interface PieceAmount {
  slug: string;
  count: number;
  goldSlug: string; // ceyrek-altin, tam-altin vs.
  goldName: string;
  path: string;
  title: string;
  description: string;
}

const ADET_COUNTS = [1, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000];
const ADET_GOLD_TYPES = [
  { slug: 'ceyrek-altin', name: 'Çeyrek Altın' },
  { slug: 'yarim-altin', name: 'Yarım Altın' },
  { slug: 'tam-altin', name: 'Tam Altın' },
  { slug: 'cumhuriyet-altini', name: 'Cumhuriyet Altını' },
  { slug: 'ata-altin', name: 'Ata Altın' },
  { slug: 'gremse-altin', name: 'Gremse Altın' },
];

function generatePieceAmounts(): PieceAmount[] {
  const result: PieceAmount[] = [];
  ADET_GOLD_TYPES.forEach((gold) => {
    ADET_COUNTS.forEach((count) => {
      const countLabel = count === 1 ? '1 adet' : `${count} adet`;
      result.push({
        slug: `${count}-${gold.slug}`,
        count,
        goldSlug: gold.slug,
        goldName: gold.name,
        path: `/altin/adet/${count}-${gold.slug}`,
        title: `${countLabel} ${gold.name} kaç TL? ${count} adet toplam fiyat`,
        description: `${count} adet ${gold.name} bugün kaç TL? Kaynaklara göre güncel alış-satış fiyatı ve ${count} adet için toplam tutar.`,
      });
    });
  });
  return result;
}

export const PIECE_AMOUNTS: PieceAmount[] = generatePieceAmounts();

// Helper: path'den GramAmount bul
export function getGramAmount(slug: string): GramAmount | undefined {
  return GRAM_AMOUNTS.find((g) => g.slug === slug);
}

// Helper: path'den PieceAmount bul
export function getPieceAmount(slug: string): PieceAmount | undefined {
  return PIECE_AMOUNTS.find((p) => p.slug === slug);
}
