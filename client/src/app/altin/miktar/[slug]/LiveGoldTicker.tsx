'use client';

import { useMarketStore } from '@/stores/market.store';
import { formatTL } from '@/lib/formatters';
import { PriceChange } from '@/components/shared/PriceChange';
import { Activity } from 'lucide-react';

interface Props {
  grams: number;
}

export function LiveGoldTicker({ grams }: Props) {
  const { goldPrices, flashMap } = useMarketStore();

  // İlk olarak "Gram Altın" fiyatını bul (serbest piyasa veya BIST)
  // market.store'daki GoldPrice tipinde goldType olarak gelir
  const gramPrice = goldPrices.find(
    (g) => g.goldType === 'Gram Altın' || g.goldType === 'GRAM ALTIN' || g.goldType === 'gram-altin'
  );
  const price = gramPrice?.buyPrice ?? gramPrice?.sellPrice ?? 0;
  const totalValue = price * grams;
  const change = gramPrice?.changePercent ?? 0;
  const flashKey = gramPrice
    ? `${gramPrice.source || 'default'}-${gramPrice.goldType}-gram`
    : 'default-gram';

  return (
    <div className="rounded-2xl border border-border bg-gradient-to-br from-card to-background p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground uppercase tracking-wider">
            Canlı Veri
          </span>
        </div>
        {gramPrice?.source && (
          <span className="text-xs text-muted-foreground">
            Kaynak: {gramPrice.source}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* 1 Gram Fiyat */}
        <div className="rounded-xl border border-border bg-card/50 p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
            1 Gram Altın
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
            {price > 0 ? formatTL(price) : '—'}
          </p>
          <PriceChange value={change} className="text-sm mt-1" />
        </div>

        {/* Hesaplanan Toplam */}
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 sm:col-span-2">
          <p className="text-xs text-primary uppercase tracking-wider font-semibold mb-1">
            {grams} Gram Altın Toplam
          </p>
          <p className="text-3xl font-extrabold num">
            {price > 0 ? formatTL(totalValue) : '—'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {grams} gr × {price > 0 ? formatTL(price) : '—'} = anlık piyasa değeri
          </p>
        </div>
      </div>

      {/* Ek Bilgiler */}
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
        <div>
          <p className="text-muted-foreground text-xs">Çeyrek eşdeğeri</p>
          <p className="font-semibold">{(grams / 1.75).toFixed(2)} adet</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">Yarım eşdeğeri</p>
          <p className="font-semibold">{(grams / 3.5).toFixed(2)} adet</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">Tam eşdeğeri</p>
          <p className="font-semibold">{(grams / 7).toFixed(2)} adet</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">Ons eşdeğeri</p>
          <p className="font-semibold">{(grams / 31.1035).toFixed(4)} oz</p>
        </div>
      </div>
    </div>
  );
}
