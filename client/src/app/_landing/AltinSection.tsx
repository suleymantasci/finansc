'use client';

import { motion } from 'framer-motion';
import { useMarketStore } from '@/stores/market.store';
import { SectionIntro } from '@/components/shared/SectionIntro';
import { PriceChange } from '@/components/shared/PriceChange';
import { formatTL, formatUSD } from '@/lib/formatters';
import { SkeletonTable } from '@/components/ui/Skeleton';

const FEATURED_GOLD = ['Gram Altın', 'Çeyrek Altın', 'Yarım Altın', 'Tam Altın', 'Ons Altın', '22 Ayar Bilezik'];

export function AltinSection() {
  const { goldPrices, goldLoading } = useMarketStore();

  const featured = FEATURED_GOLD.map((name) => goldPrices.find((g) => g.goldType === name)).filter(Boolean);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <SectionIntro
        title="Altın Fiyatları"
        description="Güncel altın fiyatlarını anlık takip edin"
        ctaLabel="Tüm altın fiyatları"
        ctaHref="/altin"
      />

      {goldLoading ? (
        <SkeletonTable rows={6} cols={4} />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Altın Türü</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Alış</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Satış</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Değişim</th>
              </tr>
            </thead>
            <tbody>
              {featured.map((gold) => (
                <tr key={gold!.goldType} className="border-b border-border last:border-0 transition-colors hover:bg-surface-hover">
                  <td className="px-4 py-3 font-medium">{gold!.goldType}</td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums">{gold!.goldType.toLowerCase().includes('ons') ? formatUSD(gold!.buyPrice) : formatTL(gold!.buyPrice)}</td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums">{gold!.goldType.toLowerCase().includes('ons') ? formatUSD(gold!.sellPrice) : formatTL(gold!.sellPrice)}</td>
                  <td className="px-4 py-3 text-right"><PriceChange value={gold!.changePercent} size="sm" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  );
}
