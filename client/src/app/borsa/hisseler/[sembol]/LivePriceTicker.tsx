'use client';

import { useMarketStore } from '@/stores/market.store';
import { formatDecimal, formatInteger, formatTL } from '@/lib/formatters';
import { PriceChange } from '@/components/shared/PriceChange';
import { TrendingUp, TrendingDown, Activity, BarChart3 } from 'lucide-react';

export function LivePriceTicker({ symbol }: { symbol: string }) {
  const { stocks, stocksLoading, flashMap } = useMarketStore();
  const stock = stocks.find((s) => s.symbol === symbol);
  const flash = flashMap[symbol];

  if (stocksLoading && !stock) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-4">
            <div className="h-3 w-16 bg-muted rounded mb-2" />
            <div className="h-6 w-24 bg-muted rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (!stock) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
        {symbol} için anlık fiyat verisi yükleniyor. Lütfen bekleyin.
      </div>
    );
  }

  const positive = stock.changePercent >= 0;

  return (
    <div className="space-y-4">
      <div className={`grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-xl border p-4 ${
        flash ? (flash === 'up' ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-rose-500/50 bg-rose-500/5') : 'border-border bg-card'
      }`}>
        <div>
          <div className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1">
            <Activity className="h-3 w-3" /> Alış
          </div>
          <div className="text-lg lg:text-xl font-mono font-semibold tabular-nums">
            {formatDecimal(stock.buyPrice)}
          </div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1">
            <Activity className="h-3 w-3" /> Satış
          </div>
          <div className="text-lg lg:text-xl font-mono font-semibold tabular-nums">
            {formatDecimal(stock.sellPrice)}
          </div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1">
            {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            Değişim %
          </div>
          <div className="text-lg lg:text-xl">
            <PriceChange value={stock.changePercent} size="md" />
          </div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1">
            <BarChart3 className="h-3 w-3" /> Hacim
          </div>
          <div className="text-lg lg:text-xl font-mono font-semibold tabular-nums">
            {formatInteger(stock.volume)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="rounded-lg border border-border bg-card p-3">
          <div className="text-xs text-muted-foreground mb-1">En Düşük</div>
          <div className="font-mono font-semibold tabular-nums">{formatDecimal(stock.low)}</div>
        </div>
        <div className="rounded-lg border border-border bg-card p-3">
          <div className="text-xs text-muted-foreground mb-1">En Yüksek</div>
          <div className="font-mono font-semibold tabular-nums">{formatDecimal(stock.high)}</div>
        </div>
        <div className="rounded-lg border border-border bg-card p-3 col-span-2 sm:col-span-1">
          <div className="text-xs text-muted-foreground mb-1">İşlem Hacmi (TL)</div>
          <div className="font-mono font-semibold tabular-nums">{formatTL(stock.turnover)}</div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Son güncelleme: <time dateTime={stock.time}>{stock.time}</time> • Veriler Borsa İstanbul'dan canlı yayınlanır
      </p>
    </div>
  );
}
