'use client';

import { useEffect } from 'react';
import { useMarketStore } from '@/stores/market.store';
import { formatDecimal } from '@/lib/formatters';
import { PriceChange } from '@/components/shared/PriceChange';
import { Building2, Activity } from 'lucide-react';
import { API_URL, GOLD_SOURCES, SSE_RECONNECT_DELAY } from '@/lib/constants';
import type { GoldStreamData } from '@/stores/market.store';

const SOURCE_LABELS: Record<string, string> = {
  'serbest-piyasa': 'Serbest Piyasa',
  'harem': 'Harem Altın',
  'altinkaynak': 'Altınkaynak',
  'kapalicarsi': 'Kapalıçarşı',
  'garanti-bbva': 'Garanti BBVA',
  'akbank': 'Akbank',
};

export function LiveGoldTicker({ goldType, slug }: { goldType: string; slug: string }) {
  // Bu sayfada TÜM altın kaynaklarına otomatik stream aç.
  // Mantık inline — Turbopack tree-shake'in önüne geçmek için hook yerine
  // doğrudan component içinde useEffect ile yönetiliyor.
  // (Bkz. fix commit: useAllGoldSourcesStream() side-effect-only çağrıları
  // production build'de tree-shake ediliyordu.)
  useEffect(() => {
    const sources = new Map<string, EventSource>();
    let cancelled = false;

    for (const src of GOLD_SOURCES) {
      let es: EventSource | null = null;
      try {
        es = new EventSource(`${API_URL}/api/market/gold/stream/${src.key}`);
      } catch {
        continue;
      }
      sources.set(src.key, es);

      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as GoldStreamData;
          if (data.type === 'prices') {
            useMarketStore.getState().updateFromGoldStream(data);
          }
        } catch {
          // yoksay
        }
      };

      es.onerror = () => {
        es?.close();
        sources.delete(src.key);
        if (cancelled) return;
        setTimeout(() => {
          if (cancelled || sources.has(src.key)) return;
          let newEs: EventSource | null = null;
          try {
            newEs = new EventSource(`${API_URL}/api/market/gold/stream/${src.key}`);
          } catch {
            return;
          }
          newEs.onmessage = es!.onmessage;
          newEs.onerror = es!.onerror;
          sources.set(src.key, newEs);
        }, SSE_RECONNECT_DELAY);
      };
    }

    return () => {
      cancelled = true;
      for (const [, es] of sources) {
        try {
          es.close();
        } catch {
          // yoksay
        }
      }
      sources.clear();
    };
  }, []);

  const { goldPrices, goldLoading, flashMap } = useMarketStore();

  // "Eski Çeyrek Altın" gibi varyantları da yakala
  const matches = goldPrices.filter((g) => {
    if (slug === 'ceyrek-altin') return g.goldType.includes('Çeyrek');
    if (slug === 'yarim-altin') return g.goldType.includes('Yarım');
    if (slug === 'tam-altin') return g.goldType === 'Tam Altın';
    if (slug === 'ata-altin') return g.goldType.includes('Ata');
    if (slug === 'cumhuriyet-altini') return g.goldType.includes('Cumhuriyet');
    if (slug === 'gram-altin') return g.goldType === 'Gram Altın';
    if (slug === 'ons-altin') return g.goldType === 'Ons Altın';
    if (slug === 'gremse-altin') return g.goldType.includes('Gremse');
    if (slug === 'bilezik') return g.goldType.includes('Bilezik');
    if (slug === 'gumus') return g.goldType === 'Gram Gümüş';
    return false;
  });

  if (goldLoading && matches.length === 0) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-4">
            <div className="h-4 w-24 bg-muted rounded mb-3" />
            <div className="h-6 w-32 bg-muted rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
        {goldType} için anlık fiyat verisi yükleniyor.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {matches.slice(0, 8).map((g) => {
          const flashKey = `${g.source}-${g.goldType}`;
          const flash = flashMap[flashKey];
          const priceColor =
            flash === 'up'
              ? 'text-up'
              : flash === 'down'
              ? 'text-down'
              : '';
          return (
          <div
            key={flashKey}
            className="rounded-xl border border-border bg-card p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Building2 className="h-3 w-3" />
                {SOURCE_LABELS[g.source] ?? g.source}
              </div>
              <div className="text-xs text-muted-foreground">
                {g.goldType}
              </div>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-xs text-muted-foreground mb-0.5">Alış</div>
                <div
                  className={`text-lg font-mono font-semibold tabular-nums transition-colors duration-700 ${priceColor}`}
                >
                  {formatDecimal(g.buyPrice)}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-0.5">Satış</div>
                <div
                  className={`text-lg font-mono font-semibold tabular-nums transition-colors duration-700 ${priceColor}`}
                >
                  {formatDecimal(g.sellPrice)}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-0.5">Değişim</div>
                <PriceChange value={g.changePercent} size="sm" />
              </div>
            </div>
          </div>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
        <Activity className="h-3 w-3" />
        Son güncelleme: <time dateTime={matches[0]?.timestamp}>{new Date(matches[0]?.timestamp ?? Date.now()).toLocaleTimeString('tr-TR')}</time>
      </p>
    </div>
  );
}
