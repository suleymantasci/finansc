import { create } from 'zustand';
import type { GoldPrice, Stock, MarketIndex, Currency } from '@/types';
import type { MarketConnectionStatus } from '@/components/shared/MarketStatus';

// ── Stream data shapes from Tasci API ──
interface BorsaStreamData {
  type: string;
  stocks?: Stock[];
  indices?: Record<string, MarketIndex>;
}

interface GoldStreamData {
  type: string;
  source?: string;
  prices?: GoldPrice[];
}

interface CurrencyStreamData {
  type?: string;
  source?: string;
  currencies?: Currency[];
  crossRates?: unknown[];
  scrapedAt?: string;
}

interface MarketState {
  // Gold
  goldPrices: GoldPrice[];
  goldLoading: boolean;

  // Stocks
  stocks: Stock[];
  stocksLoading: boolean;

  // Indices
  indices: MarketIndex[];
  indicesLoading: boolean;

  // Currency
  serbestCurrencies: Currency[];
  merkezCurrencies: Currency[];
  currencyLoading: boolean;

  // Flash effects: symbol → direction
  flashMap: Record<string, 'up' | 'down'>;

  // SSE connection statuses (set by LiveTicker)
  borsaStreamStatus: MarketConnectionStatus;
  goldStreamStatus: MarketConnectionStatus;
  currencyStreamStatus: MarketConnectionStatus;
  setBorsaStreamStatus: (s: MarketConnectionStatus) => void;
  setGoldStreamStatus: (s: MarketConnectionStatus) => void;
  setCurrencyStreamStatus: (s: MarketConnectionStatus) => void;

  // SSE stream update methods
  updateFromBorsaStream: (data: BorsaStreamData) => void;
  updateFromGoldStream: (data: GoldStreamData) => void;
  updateFromCurrencyStream: (source: string, data: CurrencyStreamData) => void;
}

export const useMarketStore = create<MarketState>((set, get) => ({
  goldPrices: [],
  goldLoading: true,
  stocks: [],
  stocksLoading: true,
  indices: [],
  indicesLoading: true,
  serbestCurrencies: [],
  merkezCurrencies: [],
  currencyLoading: true,
  flashMap: {},

  borsaStreamStatus: 'disconnected',
  goldStreamStatus: 'disconnected',
  currencyStreamStatus: 'disconnected',
  setBorsaStreamStatus: (s) => set({ borsaStreamStatus: s }),
  setGoldStreamStatus: (s) => set({ goldStreamStatus: s }),
  setCurrencyStreamStatus: (s) => set({ currencyStreamStatus: s }),

  updateFromBorsaStream: (data) => {
    if (data.type !== 'data') return;

    const newFlashes: Record<string, 'up' | 'down'> = {};

    // Compare stock prices for flash
    if (data.stocks) {
      const oldStocks = get().stocks;
      for (const ns of data.stocks) {
        if (ns.symbol === 'code') continue;
        const old = oldStocks.find((s) => s.symbol === ns.symbol);
        if (old && old.buyPrice !== ns.buyPrice) {
          newFlashes[ns.symbol] = ns.buyPrice > old.buyPrice ? 'up' : 'down';
        }
      }
    }

    // Parse indices object → array and compare for flash
    let newIndices = get().indices;
    if (data.indices) {
      newIndices = Object.values(data.indices).filter(
        (idx) => idx && idx.symbol && idx.symbol !== 'code',
      );
      const oldIndices = get().indices;
      for (const ni of newIndices) {
        const old = oldIndices.find((i) => i.symbol === ni.symbol);
        if (old && old.value !== ni.value) {
          newFlashes[ni.symbol] = ni.value > old.value ? 'up' : 'down';
        }
      }
    }

    set({
      ...(data.stocks
        ? { stocks: data.stocks.filter((s) => s.symbol !== 'code'), stocksLoading: false }
        : {}),
      indices: newIndices,
      indicesLoading: false,
      flashMap: { ...get().flashMap, ...newFlashes },
    });

    // Clear flashes after animation completes (2s)
    if (Object.keys(newFlashes).length > 0) {
      const keys = Object.keys(newFlashes);
      setTimeout(() => {
        const current = { ...get().flashMap };
        for (const k of keys) delete current[k];
        set({ flashMap: current });
      }, 2000);
    }
  },

  updateFromGoldStream: (data) => {
    if (data.type !== 'prices' || !data.prices) return;

    const oldPrices = get().goldPrices;
    const newFlashes: Record<string, 'up' | 'down'> = {};

    for (const ng of data.prices) {
      const key = `${ng.source}-${ng.goldType}`;
      const old = oldPrices.find(
        (g) => g.source === ng.source && g.goldType === ng.goldType,
      );
      if (old && old.buyPrice !== ng.buyPrice) {
        newFlashes[key] = ng.buyPrice > old.buyPrice ? 'up' : 'down';
      }
    }

    // Merge: replace prices for the streamed source, keep other sources
    const source = data.source;
    const updatedPrices = source
      ? [...oldPrices.filter((g) => g.source !== source), ...data.prices]
      : data.prices;

    set({
      goldPrices: updatedPrices,
      goldLoading: false,
      flashMap: { ...get().flashMap, ...newFlashes },
    });

    if (Object.keys(newFlashes).length > 0) {
      const keys = Object.keys(newFlashes);
      setTimeout(() => {
        const current = { ...get().flashMap };
        for (const k of keys) delete current[k];
        set({ flashMap: current });
      }, 2000);
    }
  },

  updateFromCurrencyStream: (source, data) => {
    const currencies = data?.currencies;
    if (!currencies || !Array.isArray(currencies)) return;

    const storeKey = source === 'serbest-piyasa' ? 'serbestCurrencies' : 'merkezCurrencies';
    const oldCurrencies = get()[storeKey];
    const newFlashes: Record<string, 'up' | 'down'> = {};

    for (const nc of currencies) {
      const key = `currency-${source}-${nc.name}`;
      const old = oldCurrencies.find((c) => c.name === nc.name);
      if (old && old.buyPrice !== nc.buyPrice) {
        newFlashes[key] = nc.buyPrice > old.buyPrice ? 'up' : 'down';
      }
    }

    set({
      [storeKey]: currencies,
      currencyLoading: false,
      flashMap: { ...get().flashMap, ...newFlashes },
    });

    if (Object.keys(newFlashes).length > 0) {
      const keys = Object.keys(newFlashes);
      setTimeout(() => {
        const current = { ...get().flashMap };
        for (const k of keys) delete current[k];
        set({ flashMap: current });
      }, 2000);
    }
  },
}));

export type { BorsaStreamData, GoldStreamData, CurrencyStreamData };
