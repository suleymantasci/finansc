'use client';

import { useMarketStore } from '@/stores/market.store';
import { formatTL } from '@/lib/formatters';
import { PriceChange } from '@/components/shared/PriceChange';
import { Activity } from 'lucide-react';

interface Props {
  count: number;
  goldType: string;
  goldSlug: string;
}

export function LivePieceTicker({ count, goldType, goldSlug }: Props) {
  const { goldPrices, flashMap } = useMarketStore();

  // İlgili altın türünü bul
  const gold = goldPrices.find(
    (g) =>
      g.goldType === goldType ||
      g.goldType.toLowerCase().replace(/\s+/g, '-') === goldSlug ||
      g.goldType.toLowerCase() === goldType.toLowerCase()
  );

  const unitPrice = gold?.buyPrice ?? gold?.sellPrice ?? 0;
  const total = unitPrice * count;
  const change = gold?.changePercent ?? 0;
  const flashKey = gold
    ? `${gold.source || 'default'}-${gold.goldType}-${count}`
    : 'default';

  return (
    <div className="rounded-2xl border border-border bg-gradient-to-br from-card to-background p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground uppercase tracking-wider">
            Canlı Veri
          </span>
        </div>
        {gold?.source && (
          <span className="text-xs text-muted-foreground">
            Kaynak: {gold.source}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* 1 Adet */}
        <div className="atlas-card/50 p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
            1 Adet {goldType}
          </p>
          <p
            className={`text-2xl font-bold num ${
              flashMap[flashKey] === 'up'
                ? 'text-flash-up'
                : flashMap[flashKey] === 'down'
                ? 'text-flash-down'
                : ''
            }`}
          >
            {unitPrice > 0 ? formatTL(unitPrice) : '—'}
          </p>
          <PriceChange value={change} className="text-sm mt-1" />
        </div>

        {/* Adet */}
        <div className="atlas-card/50 p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Adet</p>
          <p className="text-3xl font-extrabold num">
            {count}
          </p>
        </div>

        {/* Toplam */}
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
          <p className="text-xs text-primary uppercase tracking-wider font-semibold mb-1">
            Toplam Tutar
          </p>
          <p className="text-3xl font-extrabold num">
            {total > 0 ? formatTL(total) : '—'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {count} × {unitPrice > 0 ? formatTL(unitPrice) : '—'}
          </p>
        </div>
      </div>
    </div>
  );
}
