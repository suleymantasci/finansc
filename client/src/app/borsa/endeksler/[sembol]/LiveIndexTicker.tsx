'use client';

import { useMarketStore } from '@/stores/market.store';
import { formatDecimal } from '@/lib/formatters';
import { PriceChange } from '@/components/shared/PriceChange';
import { Activity, TrendingUp, TrendingDown, BarChart3, Clock } from 'lucide-react';

export function LiveIndexTicker({ symbol }: { symbol: string }) {
  const { indices, indicesLoading, flashMap } = useMarketStore();
  const idx = indices.find((i) => i.symbol === symbol);
  const flash = flashMap[symbol];

  if (indicesLoading && !idx) {
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

  if (!idx) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
        {symbol} endeksi için anlık veri yükleniyor. Borsa İstanbul açık olduğunda veriler canlı yayınlanır.
      </div>
    );
  }

  const positive = idx.changePercent >= 0;

  return (
    <div className="space-y-4">
      <div className={`grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-xl border p-4 ${
        flash ? (flash === 'up' ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-rose-500/50 bg-rose-500/5') : 'border-border bg-card'
      }`}>
        <div>
          <div className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1">
            <Activity className="h-3 w-3" /> Değer
          </div>
          <div className="text-lg lg:text-xl font-mono font-semibold tabular-nums">
            {formatDecimal(idx.value)}
          </div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1">
            {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            Değişim
          </div>
          <div className="text-lg lg:text-xl">
            <PriceChange value={idx.change} size="md" />
          </div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1">
            <BarChart3 className="h-3 w-3" /> Değişim %
          </div>
          <div className="text-lg lg:text-xl">
            <PriceChange value={idx.changePercent} size="md" />
          </div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1">
            <Clock className="h-3 w-3" /> Saat
          </div>
          <div className="text-lg lg:text-xl font-mono font-semibold tabular-nums">
            {idx.time}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="rounded-lg border border-border bg-card p-3">
          <div className="text-xs text-muted-foreground mb-1">En Düşük</div>
          <div className="font-mono font-semibold tabular-nums">{formatDecimal(idx.low)}</div>
        </div>
        <div className="rounded-lg border border-border bg-card p-3">
          <div className="text-xs text-muted-foreground mb-1">En Yüksek</div>
          <div className="font-mono font-semibold tabular-nums">{formatDecimal(idx.high)}</div>
        </div>
        <div className="rounded-lg border border-border bg-card p-3 col-span-2 sm:col-span-1">
          <div className="text-xs text-muted-foreground mb-1">Sembol</div>
          <div className="font-mono font-semibold">{idx.symbol}</div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Veriler Borsa İstanbul\'dan canlı yayınlanır. Borsa kapalıyken son bilinen değer gösterilir.
      </p>
    </div>
  );
}
