// ── Store'dan tekil enstrüman seçicileri ──
// Ana sayfa kartları, şerit ve hero aynı enstrümanları farklı yerlerde
// gösteriyor; seçim kuralı (tercih edilen kaynak, isim eşleşmesi) tek yerde.

import type { Currency, GoldPrice, MarketIndex } from '@/types';

/** Altın: önce serbest piyasa, yoksa ilk gelen kaynak */
export function pickGold(prices: GoldPrice[], goldType: string, source = 'serbest-piyasa'): GoldPrice | undefined {
  if (!Array.isArray(prices)) return undefined;
  return (
    prices.find((g) => g.goldType === goldType && g.source === source) ??
    prices.find((g) => g.goldType === goldType)
  );
}

export const CURRENCY_NAMES = {
  USD: 'Amerikan Doları',
  EUR: 'Euro',
  GBP: 'İngiliz Sterlini',
} as const;

export function pickCurrency(list: Currency[], code: keyof typeof CURRENCY_NAMES): Currency | undefined {
  if (!Array.isArray(list)) return undefined;
  return list.find((c) => c.name === CURRENCY_NAMES[code]);
}

export function pickIndex(list: MarketIndex[], symbol: string): MarketIndex | undefined {
  if (!Array.isArray(list)) return undefined;
  return list.find((i) => i.symbol === symbol);
}

/** Yön: artış / düşüş / yatay */
export function trendOf(v: number | null | undefined): 'up' | 'down' | 'flat' {
  if (v == null || v === 0) return 'flat';
  return v > 0 ? 'up' : 'down';
}
