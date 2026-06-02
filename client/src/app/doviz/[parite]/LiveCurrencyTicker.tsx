'use client';

import { useMarketStore } from '@/stores/market.store';
import { formatDecimal } from '@/lib/formatters';
import { PriceChange } from '@/components/shared/PriceChange';
import { Building2, Activity } from 'lucide-react';

export function LiveCurrencyTicker({ code, name }: { code: string; name: string }) {
  const { serbestCurrencies, merkezCurrencies, currencyLoading } = useMarketStore();

  // Backend currency name'leri farklı olabilir, eşle
  const nameMap: Record<string, string[]> = {
    USD: ['Amerikan Doları', 'Dolar', 'USD', 'ABD Doları'],
    EUR: ['Euro', 'EUR'],
    GBP: ['İngiliz Sterlini', 'Sterlin', 'GBP'],
    CHF: ['İsviçre Frangı', 'Frang', 'CHF'],
    JPY: ['Japon Yeni', 'Yen', 'JPY'],
    CNY: ['Çin Yuanı', 'Yuan', 'CNY'],
    RUB: ['Rus Rublesi', 'Ruble', 'RUB'],
  };

  const names = nameMap[code] ?? [name, code];

  const serbest = serbestCurrencies.find((c) => names.some((n) => c.name.toLowerCase().includes(n.toLowerCase())));
  const merkez = merkezCurrencies.find((c) => names.some((n) => c.name.toLowerCase().includes(n.toLowerCase())));

  if (currencyLoading && !serbest && !merkez) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-pulse">
        {[1, 2].map((i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-4 h-28" />
        ))}
      </div>
    );
  }

  if (!serbest && !merkez) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
        {name} ({code}) için anlık kur verisi yükleniyor. Veriler serbest piyasa ve Merkez Bankası\'ndan sağlanır.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {serbest && (
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
              <Building2 className="h-3 w-3" /> Serbest Piyasa
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <div className="text-xs text-muted-foreground mb-0.5">Alış</div>
                <div className="text-base font-mono font-semibold tabular-nums">{formatDecimal(serbest.buyPrice)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-0.5">Satış</div>
                <div className="text-base font-mono font-semibold tabular-nums">{formatDecimal(serbest.sellPrice)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-0.5">Değişim</div>
                <PriceChange value={serbest.changePercent} size="sm" />
              </div>
            </div>
          </div>
        )}
        {merkez && (
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
              <Building2 className="h-3 w-3" /> Merkez Bankası
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <div className="text-xs text-muted-foreground mb-0.5">Alış</div>
                <div className="text-base font-mono font-semibold tabular-nums">{formatDecimal(merkez.buyPrice)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-0.5">Satış</div>
                <div className="text-base font-mono font-semibold tabular-nums">{formatDecimal(merkez.sellPrice)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-0.5">Değişim</div>
                <PriceChange value={merkez.changePercent} size="sm" />
              </div>
            </div>
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
        <Activity className="h-3 w-3" />
        Son güncelleme: <time>{serbest?.time ?? merkez?.time ?? '—'}</time>
      </p>
    </div>
  );
}
