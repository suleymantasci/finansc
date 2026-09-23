// ── Canlı fiyat seçici ──
// Detay sayfaları, ilgili listeler ve çevirici aynı "fiyat" kavramını kullanır.
// Store'dan tek biçimde okumak için saf fonksiyon (hook değil).

import type { Currency, GoldPrice, MarketIndex, Stock } from '@/types';
import { CURRENCY_BY_CODE } from '@/lib/instruments/currencies';
import { GOLD_BY_SLUG } from '@/lib/instruments/gold';

export type QuoteSpec =
  | { kind: 'gold'; slug: string }
  | { kind: 'fx'; code: string }
  | { kind: 'stock'; symbol: string }
  | { kind: 'index'; symbol: string };

export interface Quote {
  price: number;
  buy?: number;
  sell?: number;
  changePct: number | null;
  low?: number;
  high?: number;
  volume?: number;
  turnover?: number;
  /** "HH:MM" veya ISO */
  time?: string;
  source: string;
  currency: 'TRY' | 'USD';
}

interface StoreSlice {
  goldPrices: GoldPrice[];
  serbestCurrencies: Currency[];
  merkezCurrencies: Currency[];
  stocks: Stock[];
  indices: MarketIndex[];
}

const SOURCE_LABELS: Record<string, string> = {
  'serbest-piyasa': 'Serbest piyasa',
  harem: 'Harem Altın',
  altinkaynak: 'Altınkaynak',
  kapalicarsi: 'Kapalıçarşı',
  'garanti-bbva': 'Garanti BBVA',
  akbank: 'Akbank',
  'merkez-bankasi': 'TCMB',
};

export const sourceLabel = (s: string) => SOURCE_LABELS[s] ?? s;

export function selectQuote(state: StoreSlice, spec: QuoteSpec): Quote | null {
  switch (spec.kind) {
    case 'gold': {
      const entry = GOLD_BY_SLUG[spec.slug];
      if (!entry) return null;
      const list = state.goldPrices.filter((g) => g.goldType === entry.liveName);
      const g = list.find((x) => x.source === 'serbest-piyasa') ?? list[0];
      if (!g) return null;
      return {
        price: g.sellPrice,
        buy: g.buyPrice,
        sell: g.sellPrice,
        changePct: g.changePercent,
        time: g.timestamp,
        source: sourceLabel(g.source),
        currency: entry.currency,
      };
    }
    case 'fx': {
      const entry = CURRENCY_BY_CODE[spec.code];
      if (!entry) return null;
      const s = entry.serbestName ? state.serbestCurrencies.find((c) => c.name === entry.serbestName) : undefined;
      if (s) {
        return { price: s.sellPrice, buy: s.buyPrice, sell: s.sellPrice, changePct: s.changePercent, time: s.time, source: 'Serbest piyasa', currency: 'TRY' };
      }
      const m = entry.tcmbName ? state.merkezCurrencies.find((c) => c.name === entry.tcmbName) : undefined;
      if (m) {
        const u = entry.tcmbUnit;
        return { price: m.sellPrice / u, buy: m.buyPrice / u, sell: m.sellPrice / u, changePct: m.changePercent, time: m.time, source: 'TCMB', currency: 'TRY' };
      }
      return null;
    }
    case 'stock': {
      const s = state.stocks.find((x) => x.symbol === spec.symbol);
      if (!s) return null;
      return {
        price: s.lastPrice,
        buy: s.buyPrice,
        sell: s.sellPrice,
        changePct: s.changePercent,
        low: s.low,
        high: s.high,
        volume: s.volume,
        turnover: s.turnover,
        time: s.time,
        source: 'Borsa İstanbul (15 dk gecikmeli)',
        currency: 'TRY',
      };
    }
    case 'index': {
      const i = state.indices.find((x) => x.symbol === spec.symbol);
      if (!i) return null;
      return { price: i.value, changePct: i.changePercent, low: i.low, high: i.high, time: i.time, source: 'Borsa İstanbul (15 dk gecikmeli)', currency: 'TRY' };
    }
  }
}

export function quoteDecimals(spec: QuoteSpec): number {
  return spec.kind === 'fx' ? 4 : 2;
}
