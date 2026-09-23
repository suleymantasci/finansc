// Döviz sayfası içeriği: el yazımı içerik (seo-data/currency) varsa o, yoksa
// yalnızca doğrulanabilir bilgilerden oluşan şablon. Sayısal değer içermez —
// güncel kur sayfada canlı gösterilir.

import { CURRENCY_META } from '@/lib/seo-data/currency';
import { CURRENCIES, type CurrencyEntry } from './currencies';

export interface CurrencyContent {
  description: string;
  faq: { q: string; a: string }[];
  related: CurrencyEntry[];
}

export function currencyContent(e: CurrencyEntry): CurrencyContent {
  const hand = CURRENCY_META[e.code];
  const sources = [e.serbestName && 'serbest piyasa', e.tcmbName && 'Türkiye Cumhuriyet Merkez Bankası (TCMB) gösterge kuru'].filter(Boolean).join(' ve ');

  const description =
    hand?.description ??
    `${e.name} (${e.code}), ${e.country} için kullanılan resmi para birimidir. Bu sayfada ${e.code}/TRY kurunu ${sources} kaynaklarından anlık olarak izleyebilir, geçmiş grafiği inceleyebilir ve Türk lirasına çevirebilirsiniz.`;

  const faq = hand?.faq ?? [
    {
      q: `${e.code}/TRY kuru hangi kaynaktan gösteriliyor?`,
      a: `${e.name} kuru ${sources} verilerinden gösterilir. Serbest piyasa kuru gün içinde sürekli değişir; TCMB gösterge kuru ise günlük olarak ilan edilir.`,
    },
    {
      q: `1 ${e.code} kaç Türk lirası?`,
      a: `Güncel ${e.name} kuru bu sayfanın üst kısmında anlık olarak gösterilir. Farklı tutarları çevirmek için sayfadaki çeviriciyi kullanabilirsiniz.`,
    },
    ...(e.tcmbUnit !== 1
      ? [{ q: `TCMB ${e.name} kurunu neden ${e.tcmbUnit} birim üzerinden verir?`, a: `TCMB bazı düşük değerli para birimlerini ${e.tcmbUnit} birim üzerinden ilan eder. Bu sayfada karşılaştırma kolaylığı için değerler 1 ${e.code} başına çevrilerek gösterilir.` }]
      : []),
  ];

  const handRelated = hand?.relatedSlugs?.map((s) => CURRENCIES.find((c) => c.slug === s)).filter((c): c is CurrencyEntry => !!c) ?? [];
  const idx = CURRENCIES.findIndex((c) => c.code === e.code);
  const neighbors = [CURRENCIES[idx - 1], CURRENCIES[idx + 1], CURRENCIES[idx + 2]].filter((c): c is CurrencyEntry => !!c && c.code !== e.code);
  const majors = CURRENCIES.filter((c) => c.major && c.code !== e.code).slice(0, 4);
  const seen = new Set<string>();
  const related = [...handRelated, ...majors, ...neighbors].filter((c) => (seen.has(c.code) ? false : (seen.add(c.code), true))).slice(0, 6);

  return { description, faq, related };
}
