'use client';

import { useMarketStore } from '@/stores/market.store';
import { formatDecimal } from '@/lib/formatters';
import { PriceChange } from '@/components/shared/PriceChange';
import { Building2, Activity } from 'lucide-react';
import { useAllGoldSourcesStream } from '@/hooks/useAllGoldSourcesStream';

const SOURCE_LABELS: Record<string, string> = {
  'serbest-piyasa': 'Serbest Piyasa',
  'harem': 'Harem Altın',
  'altinkaynak': 'Altınkaynak',
  'kapalicarsi': 'Kapalıçarşı',
  'garanti-bbva': 'Garanti BBVA',
  'akbank': 'Akbank',
};

export function LiveGoldTicker({ goldType, slug }: { goldType: string; slug: string }) {
  // Bu sayfada TÜM altın kaynaklarına otomatik stream aç
  // (sourceless ?kaynak ziyareti beklenmeden, kartlar hep render edilsin)
  useAllGoldSourcesStream();

  const { goldPrices, goldLoading } = useMarketStore();

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
        {matches.slice(0, 8).map((g) => (
          <div
            key={`${g.source}-${g.goldType}`}
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
                <div className="text-lg font-mono font-semibold tabular-nums">
                  {formatDecimal(g.buyPrice)}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-0.5">Satış</div>
                <div className="text-lg font-mono font-semibold tabular-nums">
                  {formatDecimal(g.sellPrice)}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-0.5">Değişim</div>
                <PriceChange value={g.changePercent} size="sm" />
              </div>
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
        <Activity className="h-3 w-3" />
        Son güncelleme: <time dateTime={matches[0]?.timestamp}>{new Date(matches[0]?.timestamp ?? Date.now()).toLocaleTimeString('tr-TR')}</time>
      </p>
    </div>
  );
}
