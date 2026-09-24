'use client';

import { useMarketStore } from '@/stores/market.store';
import { formatTL } from '@/lib/formatters';
import { PriceChange } from '@/components/shared/PriceChange';
import { sourceLabel } from '@/lib/quote';
import { pickGold } from '@/lib/market-pick';
import { GOLD_BY_SLUG } from '@/lib/instruments/gold';

interface Props {
  count: number;
  goldType: string;
  goldSlug: string;
}

export function LivePieceTicker({ count, goldType, goldSlug }: Props) {
  const { goldPrices, flashMap } = useMarketStore();

  // İlgili altın türünü bul
  // Önce serbest piyasa (detay sayfalarıyla tutarlı); fiyat = satış (ödenecek tutar)
  const liveName = GOLD_BY_SLUG[goldSlug]?.liveName ?? goldType;
  const gold = pickGold(goldPrices, liveName);

  const unitPrice = gold?.sellPrice ?? gold?.buyPrice ?? 0;
  const total = unitPrice * count;
  const change = gold?.changePercent ?? 0;
  const flashKey = gold
    ? `${gold.source || 'default'}-${gold.goldType}-${count}`
    : 'default';

  return (
    <div className="atlas-card p-5 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="eyebrow text-primary">Güncel fiyat</span>
        </div>
        {gold?.source && (
          <span className="text-xs text-muted-foreground">
            Kaynak: {sourceLabel(gold.source)}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* 1 Adet */}
        <div className="rounded-xl border border-border bg-elevated p-4">
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
        <div className="rounded-xl border border-border bg-elevated p-4">
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
