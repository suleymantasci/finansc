'use client';

import { useEffect, useMemo, useCallback } from 'react';
import { useMarketStore } from '@/stores/market.store';
import type { BorsaStreamData, GoldStreamData, CurrencyStreamData } from '@/stores/market.store';
import { useSSE } from '@/hooks/useSSE';
import Link from 'next/link';
import { pickCurrency, pickGold, pickIndex } from '@/lib/market-pick';
import { API_URL } from '@/lib/constants';
import type { GoldPrice } from '@/types';
import { cn } from '@/lib/utils';

interface TickerItem {
  label: string;
  href: string;
  value: number;
  decimals: number;
  change: number | null;
  flashKey: string;
  prefix?: string;
}

function LiveTicker() {
  const {
    indices, goldPrices, serbestCurrencies, flashMap,
    updateFromBorsaStream, updateFromGoldStream, updateFromCurrencyStream,
    setBorsaStreamStatus, setGoldStreamStatus, setCurrencyStreamStatus,
  } = useMarketStore();

  // Tek birleşik akış (borsa + altın + serbest piyasa + TCMB): sayfa başına tek kalıcı
  // bağlantı. Ayrı akışlar HTTP/1.1'de tarayıcının 6 bağlantı sınırını dolduruyordu.
  const handleMarket = useCallback(
    (raw: unknown) => {
      const msg = raw as { channel?: string; payload?: unknown };
      switch (msg.channel) {
        case 'borsa': {
          const d = msg.payload as BorsaStreamData;
          if (d?.type === 'data') updateFromBorsaStream(d);
          break;
        }
        case 'gold': {
          const d = msg.payload as GoldStreamData;
          if (d?.type === 'prices') updateFromGoldStream(d);
          break;
        }
        case 'currency:serbest-piyasa':
          updateFromCurrencyStream('serbest-piyasa', msg.payload as CurrencyStreamData);
          break;
        case 'currency:merkez-bankasi':
          updateFromCurrencyStream('merkez-bankasi', msg.payload as CurrencyStreamData);
          break;
      }
    },
    [updateFromBorsaStream, updateFromGoldStream, updateFromCurrencyStream],
  );

  const { status: streamStatus } = useSSE({ url: '/api/market/stream', onMessage: handleMarket });
  const borsaStatus = streamStatus;
  const goldStatus = streamStatus;
  const currencyStatus = streamStatus;

  // Altın akışı kaynakları sırayla ve piyasa kapalıyken seyrek gönderiyor; bazı
  // türler (ör. Cumhuriyet) dakikalarca boş kalıyordu. İlk açılışta REST ile doldur.
  // Borsa/döviz akışı bağlanır bağlanmaz tam veri gönderdiği için onlara gerek yok.
  useEffect(() => {
    const ctrl = new AbortController();
    const get = <T,>(path: string) =>
      fetch(`${API_URL}${path}`, { signal: ctrl.signal }).then((r) => (r.ok ? (r.json() as Promise<T>) : null)).catch(() => null);

    get<GoldPrice[]>('/api/market/gold').then((list) => {
      if (!Array.isArray(list)) return;
      const bySource = new Map<string, GoldPrice[]>();
      for (const g of list) bySource.set(g.source, [...(bySource.get(g.source) ?? []), g]);
      // Akıştan önce gelen kaynağın üzerine yazma
      const seen = new Set(useMarketStore.getState().goldPrices.map((g) => g.source));
      for (const [source, prices] of bySource) {
        if (!seen.has(source)) updateFromGoldStream({ type: 'prices', source, prices });
      }
    });

    return () => ctrl.abort();
  }, [updateFromGoldStream]);

  // Propagate SSE statuses to store for page-level MarketStatus indicators
  useEffect(() => { setBorsaStreamStatus(borsaStatus); }, [borsaStatus, setBorsaStreamStatus]);
  useEffect(() => { setGoldStreamStatus(goldStatus); }, [goldStatus, setGoldStreamStatus]);
  useEffect(() => { setCurrencyStreamStatus(currencyStatus); }, [currencyStatus, setCurrencyStreamStatus]);

  // Sabit sıra: en çok bakılan enstrümanlar önce. Her öğe kendi sayfasına gider.
  const tickerItems = useMemo(() => {
    const items: TickerItem[] = [];
    const usd = pickCurrency(serbestCurrencies, 'USD');
    const eur = pickCurrency(serbestCurrencies, 'EUR');
    const gbp = pickCurrency(serbestCurrencies, 'GBP');
    const gram = pickGold(goldPrices, 'Gram Altın');
    const ceyrek = pickGold(goldPrices, 'Çeyrek Altın');
    const ons = pickGold(goldPrices, 'Ons Altın');
    const xu100 = pickIndex(indices, 'XU100');
    const xu030 = pickIndex(indices, 'XU030');

    if (usd) items.push({ label: 'USD/TRY', href: '/doviz/dolar', value: usd.sellPrice, decimals: 4, change: usd.changePercent, flashKey: `currency-serbest-piyasa-${usd.name}` });
    if (eur) items.push({ label: 'EUR/TRY', href: '/doviz/euro', value: eur.sellPrice, decimals: 4, change: eur.changePercent, flashKey: `currency-serbest-piyasa-${eur.name}` });
    if (gram) items.push({ label: 'Gram Altın', href: '/altin/gram-altin', value: gram.sellPrice, decimals: 2, change: gram.changePercent, flashKey: `${gram.source}-${gram.goldType}` });
    if (xu100) items.push({ label: 'BIST 100', href: '/borsa/endeksler/XU100', value: xu100.value, decimals: 2, change: xu100.changePercent, flashKey: xu100.symbol });
    if (ons) items.push({ label: 'Ons Altın', href: '/altin/ons-altin', value: ons.sellPrice, decimals: 2, change: ons.changePercent, flashKey: `${ons.source}-${ons.goldType}`, prefix: '$' });
    if (gbp) items.push({ label: 'GBP/TRY', href: '/doviz/sterlin', value: gbp.sellPrice, decimals: 4, change: gbp.changePercent, flashKey: `currency-serbest-piyasa-${gbp.name}` });
    if (ceyrek) items.push({ label: 'Çeyrek Altın', href: '/altin/ceyrek-altin', value: ceyrek.sellPrice, decimals: 2, change: ceyrek.changePercent, flashKey: `${ceyrek.source}-${ceyrek.goldType}` });
    if (xu030) items.push({ label: 'BIST 30', href: '/borsa/endeksler/XU030', value: xu030.value, decimals: 2, change: xu030.changePercent, flashKey: xu030.symbol });
    return items;
  }, [indices, goldPrices, serbestCurrencies]);

  return (
    <div className="border-b border-border bg-background/80">
      <div className="mx-auto flex h-9 max-w-[1440px] items-center gap-4 px-4 lg:px-8">
        <ul className="scroll-strip flex min-w-0 flex-1 items-center gap-7" aria-label="Piyasa özeti">
          {tickerItems.length === 0
            ? Array.from({ length: 6 }).map((_, i) => (
                <li key={i} className="skeleton-shimmer h-3 w-32 shrink-0 rounded" aria-hidden="true" />
              ))
            : tickerItems.map((item) => {
                const ch = item.change ?? 0;
                return (
                  <li key={item.label} className="relative shrink-0">
                    <Link href={item.href} className="group flex items-center gap-2 text-xs">
                      <span className="text-muted-foreground transition-colors group-hover:text-foreground">{item.label}</span>
                      <span
                        className={cn(
                          'num font-medium text-foreground',
                          flashMap[item.flashKey] === 'up' && 'text-flash-up',
                          flashMap[item.flashKey] === 'down' && 'text-flash-down',
                        )}
                      >
                        {item.prefix}
                        {item.value.toLocaleString('tr-TR', { minimumFractionDigits: item.decimals, maximumFractionDigits: item.decimals })}
                      </span>
                      <span className={cn('num flex items-center gap-0.5 text-[11px]', ch > 0 && 'text-up', ch < 0 && 'text-down', ch === 0 && 'text-neutral')}>
                        <span aria-hidden="true">{ch > 0 ? '▲' : ch < 0 ? '▼' : '•'}</span>
                        <span className="sr-only">{ch > 0 ? 'artış' : ch < 0 ? 'düşüş' : 'değişim yok'}</span>
                        %{Math.abs(ch).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </Link>
                  </li>
                );
              })}
        </ul>
      </div>
    </div>
  );
}

export { LiveTicker };
