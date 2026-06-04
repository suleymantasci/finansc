'use client';

import { motion } from 'framer-motion';
import { useMarketStore } from '@/stores/market.store';
import { formatDecimal, formatPercent } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const HERO_ITEMS = ['XU100', 'Gram Altın', 'USD/TRY', 'EUR/TRY'];

export function HeroSection() {
  const { indices, goldPrices, serbestCurrencies, flashMap } = useMarketStore();

  const cards = HERO_ITEMS.map((key) => {
    const idx = Array.isArray(indices) ? indices.find((i) => i.symbol === key) : undefined;
    const gold = Array.isArray(goldPrices) ? goldPrices.find((g) => g.goldType === key) : undefined;
    if (idx) return { symbol: idx.symbol, value: idx.value, change: idx.changePercent, flashKey: idx.symbol };
    if (gold) return { symbol: gold.goldType, value: gold.buyPrice, change: gold.changePercent, flashKey: `${gold.source}-${gold.goldType}` };
    // Currency lookup for USD/TRY, EUR/TRY
    if (key === 'USD/TRY') {
      const usd = serbestCurrencies.find((c) => c.name === 'Amerikan Doları');
      if (usd) return { symbol: 'USD/TRY', value: usd.sellPrice, change: usd.changePercent, flashKey: 'currency-serbest-piyasa-Amerikan Doları' };
    }
    if (key === 'EUR/TRY') {
      const eur = serbestCurrencies.find((c) => c.name === 'Euro');
      if (eur) return { symbol: 'EUR/TRY', value: eur.sellPrice, change: eur.changePercent, flashKey: 'currency-serbest-piyasa-Euro' };
    }
    return { symbol: key, value: 0, change: 0, flashKey: '' };
  });

  return (
    <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-card to-background">
      <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8 lg:py-16">
        {/* H1 server.tsx tarafından sağlanır (page.tsx); burada animasyonlu kartlar */}

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          {cards.map((card, i) => (
            <motion.div
              key={card.symbol}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="rounded-xl border border-border bg-card p-4 lg:p-5"
            >
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {card.symbol}
              </p>
              <p className={cn(
                'mt-1 text-2xl font-bold font-mono tabular-nums lg:text-3xl',
                flashMap[card.flashKey] === 'up' && 'text-flash-up',
                flashMap[card.flashKey] === 'down' && 'text-flash-down',
              )}>
                {card.value > 0 ? formatDecimal(card.value) : '—'}
              </p>
              <div className="mt-1 flex items-center gap-1">
                {card.change > 0 ? (
                  <TrendingUp className="h-3.5 w-3.5 text-up" />
                ) : card.change < 0 ? (
                  <TrendingDown className="h-3.5 w-3.5 text-down" />
                ) : (
                  <Minus className="h-3.5 w-3.5 text-neutral" />
                )}
                <span
                  className={cn(
                    'text-sm font-mono font-semibold tabular-nums',
                    card.change > 0 && 'text-up',
                    card.change < 0 && 'text-down',
                    card.change === 0 && 'text-neutral',
                  )}
                >
                  {formatPercent(card.change)}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
