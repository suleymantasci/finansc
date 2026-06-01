'use client';

import { useEffect, useState } from 'react';
import { useFavoriteStore } from '@/stores/favorite.store';
import { useMarketStore } from '@/stores/market.store';
import { PriceChange } from '@/components/shared/PriceChange';
import { Button } from '@/components/ui/Button';
import { SkeletonTable } from '@/components/ui/Skeleton';
import { formatTL, formatUSD, formatDecimal } from '@/lib/formatters';
import { Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type Tab = 'hisseler' | 'altinlar';

export default function FavorilerPage() {
  const [tab, setTab] = useState<Tab>('hisseler');
  const { favorites, fetchFavorites, removeFavorite } = useFavoriteStore();
  const { stocks, goldPrices, flashMap } = useMarketStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFavorites().finally(() => setLoading(false));
  }, [fetchFavorites]);

  const stockFavs = favorites.filter((f) => f.type === 'stock');
  const goldFavs = favorites.filter((f) => f.type === 'gold');

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'hisseler', label: 'Hisseler', count: stockFavs.length },
    { key: 'altinlar', label: 'Altınlar', count: goldFavs.length },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold">Favorilerim</h1>
      <p className="mt-1 text-sm text-muted-foreground">Takip ettiğiniz hisse ve altınlar</p>

      <div className="mt-4 flex gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
              tab === t.key
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-surface-hover',
            )}
          >
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      <div className="mt-4">
        {loading ? (
          <SkeletonTable rows={5} cols={4} />
        ) : tab === 'hisseler' ? (
          stockFavs.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Favori hisse bulunmuyor.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Sembol</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">Fiyat</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">Değişim</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground"></th>
                  </tr>
                </thead>
                <tbody>
                  {stockFavs.map((fav) => {
                    const stock = stocks.find((s) => s.symbol === fav.symbol);
                    return (
                      <tr key={fav.id} className={cn(
                        'border-b border-border last:border-0',
                        stock && flashMap[fav.symbol] === 'up' && 'flash-up',
                        stock && flashMap[fav.symbol] === 'down' && 'flash-down',
                      )}>
                        <td className="px-4 py-3 font-medium">{fav.symbol}</td>
                        <td className="px-4 py-3 text-right font-mono tabular-nums">{stock ? formatDecimal(stock.buyPrice) : '—'}</td>
                        <td className="px-4 py-3 text-right">{stock ? <PriceChange value={stock.changePercent} size="sm" /> : '—'}</td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => removeFavorite(fav.id)} className="text-muted-foreground hover:text-danger"><Trash2 className="h-4 w-4" /></button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        ) : (
          goldFavs.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Favori altın bulunmuyor.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Tür</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">Alış</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">Satış</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground"></th>
                  </tr>
                </thead>
                <tbody>
                  {goldFavs.map((fav) => {
                    const gold = goldPrices.find((g) => g.goldType === fav.symbol);
                    return (
                      <tr key={fav.id} className={cn(
                        'border-b border-border last:border-0',
                        gold && flashMap[`${gold.source}-${gold.goldType}`] === 'up' && 'flash-up',
                        gold && flashMap[`${gold.source}-${gold.goldType}`] === 'down' && 'flash-down',
                      )}>
                        <td className="px-4 py-3 font-medium">{fav.symbol}</td>
                        <td className="px-4 py-3 text-right font-mono tabular-nums">{gold ? (fav.symbol.toLowerCase().includes('ons') ? formatUSD(gold.sellPrice) : formatTL(gold.sellPrice)) : '—'}</td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => removeFavorite(fav.id)} className="text-muted-foreground hover:text-danger"><Trash2 className="h-4 w-4" /></button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>
    </div>
  );
}
