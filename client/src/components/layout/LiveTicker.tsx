'use client';

import { useEffect, useMemo, useCallback } from 'react';
import { useMarketStore } from '@/stores/market.store';
import type { BorsaStreamData, GoldStreamData, CurrencyStreamData } from '@/stores/market.store';
import { useSSE } from '@/hooks/useSSE';
import { formatDecimal, formatPercent, formatUSD } from '@/lib/formatters';
import { cn } from '@/lib/utils';

const CURRENCY_TICKER_MAP: Record<string, string> = {
  'Amerikan Doları': 'USD/TRY',
  'Euro': 'EUR/TRY',
  'İngiliz Sterlini': 'GBP/TRY',
};

function LiveTicker() {
  const {
    indices, goldPrices, serbestCurrencies,
    updateFromBorsaStream, updateFromGoldStream, updateFromCurrencyStream,
    setBorsaStreamStatus, setGoldStreamStatus, setCurrencyStreamStatus,
  } = useMarketStore();

  // SSE connections for live updates — sole data source
  const handleBorsaSSE = useCallback(
    (data: unknown) => {
      const d = data as BorsaStreamData;
      if (d.type === 'data') updateFromBorsaStream(d);
    },
    [updateFromBorsaStream],
  );

  const handleGoldSSE = useCallback(
    (data: unknown) => {
      const d = data as GoldStreamData;
      if (d.type === 'prices') updateFromGoldStream(d);
    },
    [updateFromGoldStream],
  );

  const handleCurrencySSE = useCallback(
    (data: unknown) => {
      updateFromCurrencyStream('serbest-piyasa', data as CurrencyStreamData);
    },
    [updateFromCurrencyStream],
  );

  const { status: borsaStatus } = useSSE({ url: '/api/market/borsa/stream', onMessage: handleBorsaSSE });
  const { status: goldStatus } = useSSE({ url: '/api/market/gold/stream', onMessage: handleGoldSSE });
  const { status: currencyStatus } = useSSE({ url: '/api/market/currency/serbest-piyasa/stream', onMessage: handleCurrencySSE });

  // Propagate SSE statuses to store for page-level MarketStatus indicators
  useEffect(() => { setBorsaStreamStatus(borsaStatus); }, [borsaStatus, setBorsaStreamStatus]);
  useEffect(() => { setGoldStreamStatus(goldStatus); }, [goldStatus, setGoldStreamStatus]);
  useEffect(() => { setCurrencyStreamStatus(currencyStatus); }, [currencyStatus, setCurrencyStreamStatus]);

  // Derive ticker items from store data
  const tickerItems = useMemo(() => {
    const items: { symbol: string; value: number; changePercent: number }[] = [];
    if (Array.isArray(indices)) {
      items.push(
        ...indices
          .filter((idx) => idx.symbol && idx.symbol !== 'code')
          .slice(0, 3)
          .map((idx) => ({ symbol: idx.symbol, value: idx.value, changePercent: idx.changePercent })),
      );
    }
    if (Array.isArray(goldPrices)) {
      items.push(
        ...goldPrices
          .filter((g) => ['Gram Altın', 'Çeyrek Altın', 'Ons Altın'].includes(g.goldType))
          .slice(0, 3)
          .map((g) => ({ symbol: g.goldType, value: g.buyPrice, changePercent: g.changePercent })),
      );
    }
    // Add USD, EUR, GBP from serbest piyasa
    if (Array.isArray(serbestCurrencies)) {
      for (const [name, symbol] of Object.entries(CURRENCY_TICKER_MAP)) {
        const c = serbestCurrencies.find((cur) => cur.name === name);
        if (c) {
          items.push({ symbol, value: c.sellPrice, changePercent: c.changePercent });
        }
      }
    }
    return items;
  }, [indices, goldPrices, serbestCurrencies]);

  if (tickerItems.length === 0) return null;

  // Duplicate items for seamless infinite scroll
  const items = [...tickerItems, ...tickerItems];

  return (
    <div className="w-full overflow-hidden border-b border-border bg-card">
      <div className="ticker-animate flex items-center gap-6 py-1.5 whitespace-nowrap">
        {items.map((item, i) => (
          <div
            key={`${item.symbol}-${i}`}
            className="flex items-center gap-2 text-xs"
          >
            <span className="font-medium text-foreground">
              {item.symbol}
            </span>
            <span className="font-mono tabular-nums text-foreground">
              {item.symbol.toLowerCase().includes('ons') ? formatUSD(item.value) : formatDecimal(item.value)}
            </span>
            <span
              className={cn(
                'font-mono tabular-nums font-semibold',
                item.changePercent > 0 && 'text-up',
                item.changePercent < 0 && 'text-down',
                item.changePercent === 0 && 'text-neutral',
              )}
            >
              {formatPercent(item.changePercent)}
            </span>
            <span className="mx-2 text-border">•</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export { LiveTicker };
