'use client';

import { useMarketStore } from '@/stores/market.store';
import { formatTL } from '@/lib/formatters';
import { pickGold } from '@/lib/market-pick';
import { PriceChange } from '@/components/shared/PriceChange';
import { sourceLabel } from '@/lib/quote';

interface Props {
  grams: number;
}

export function LiveGoldTicker({ grams }: Props) {
  const { goldPrices, flashMap } = useMarketStore();

  // İlk olarak "Gram Altın" fiyatını bul (serbest piyasa veya BIST)
  // market.store'daki GoldPrice tipinde goldType olarak gelir
  // Detay sayfalarıyla aynı kural: önce serbest piyasa; "kaç TL" sorusunun cevabı satış fiyatı
  const gramPrice = pickGold(goldPrices, 'Gram Altın');
  const price = gramPrice?.sellPrice ?? gramPrice?.buyPrice ?? 0;
  const totalValue = price * grams;
  const change = gramPrice?.changePercent ?? 0;
  const flashKey = gramPrice
    ? `${gramPrice.source || 'default'}-${gramPrice.goldType}-gram`
    : 'default-gram';

  return (
    <div className="atlas-card p-5 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="eyebrow text-primary">Güncel fiyat</span>
        </div>
        {gramPrice?.source && (
          <span className="text-xs text-muted-foreground">
            Kaynak: {sourceLabel(gramPrice.source)}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* 1 Gram Fiyat */}
        <div className="rounded-xl border border-border bg-elevated p-4">
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

      {/* Değer eşdeğerleri: ağırlıkla değil güncel satış fiyatlarıyla (çeyrek/yarım/tam 22 ayar ve işçilikli) */}
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        {(['Çeyrek Altın', 'Yarım Altın', 'Tam Altın'] as const).map((t) => {
          const coin = pickGold(goldPrices, t);
          const n = coin && coin.sellPrice > 0 && totalValue > 0 ? totalValue / coin.sellPrice : null;
          return (
            <div key={t}>
              <p className="text-xs text-muted-foreground">Değerce {t.split(' ')[0].toLocaleLowerCase('tr-TR')}</p>
              <p className="num font-medium">{n == null ? '—' : `${n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} adet`}</p>
            </div>
          );
        })}
        <div>
          <p className="text-xs text-muted-foreground">Ağırlıkça ons</p>
          <p className="num font-medium">{(grams / 31.1035).toLocaleString('tr-TR', { minimumFractionDigits: 4, maximumFractionDigits: 4 })} oz</p>
        </div>
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground">Değerce karşılıklar güncel satış fiyatlarından hesaplanır; alış-satış farkı nedeniyle gerçek alım adedi farklı olabilir.</p>
    </div>
  );
}
