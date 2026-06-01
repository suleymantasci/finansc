'use client';

import { motion } from 'framer-motion';
import { useMarketStore } from '@/stores/market.store';
import { SectionIntro } from '@/components/shared/SectionIntro';
import { PriceChange } from '@/components/shared/PriceChange';
import { formatDecimal } from '@/lib/formatters';
import { SkeletonTable } from '@/components/ui/Skeleton';

export function BorsaOzetSection() {
  const { stocks, stocksLoading } = useMarketStore();

  const sorted = [...stocks].sort((a, b) => b.changePercent - a.changePercent);
  const top5 = sorted.slice(0, 5);
  const bottom5 = sorted.slice(-5).reverse();

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <SectionIntro
        title="Borsa İstanbul"
        description="Borsa İstanbul'dan anlık veriler"
        ctaLabel="Tüm hisseleri gör"
        ctaHref="/borsa/hisseler"
      />

      {stocksLoading ? (
        <SkeletonTable rows={5} cols={3} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {/* En çok yükselen */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="border-b border-border bg-muted px-4 py-2.5">
              <h3 className="text-sm font-semibold text-up">↑ En Çok Yükselen</h3>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sembol</th>
                  <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Fiyat</th>
                  <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Değişim</th>
                </tr>
              </thead>
              <tbody>
                {top5.map((s) => (
                  <tr key={s.symbol} className="border-b border-border last:border-0">
                    <td className="px-4 py-2.5 font-medium">{s.symbol}</td>
                    <td className="px-4 py-2.5 text-right font-mono tabular-nums">{formatDecimal(s.buyPrice)}</td>
                    <td className="px-4 py-2.5 text-right"><PriceChange value={s.changePercent} size="sm" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* En çok düşen */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="border-b border-border bg-muted px-4 py-2.5">
              <h3 className="text-sm font-semibold text-down">↓ En Çok Düşen</h3>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sembol</th>
                  <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Fiyat</th>
                  <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Değişim</th>
                </tr>
              </thead>
              <tbody>
                {bottom5.map((s) => (
                  <tr key={s.symbol} className="border-b border-border last:border-0">
                    <td className="px-4 py-2.5 font-medium">{s.symbol}</td>
                    <td className="px-4 py-2.5 text-right font-mono tabular-nums">{formatDecimal(s.buyPrice)}</td>
                    <td className="px-4 py-2.5 text-right"><PriceChange value={s.changePercent} size="sm" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </motion.div>
  );
}
