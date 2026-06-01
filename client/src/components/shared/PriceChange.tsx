import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { formatPercent } from '@/lib/formatters';
import { cn } from '@/lib/utils';

interface PriceChangeProps {
  value: number;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

const sizeStyles = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
};

const iconSizes = {
  sm: 'h-3 w-3',
  md: 'h-3.5 w-3.5',
  lg: 'h-4 w-4',
};

function PriceChange({ value, size = 'md', showIcon = true, className }: PriceChangeProps) {
  const isUp = value > 0;
  const isDown = value < 0;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 font-mono font-semibold tabular-nums',
        sizeStyles[size],
        isUp && 'text-up',
        isDown && 'text-down',
        !isUp && !isDown && 'text-neutral',
        className,
      )}
    >
      {showIcon && (
        isUp ? <TrendingUp className={iconSizes[size]} /> :
        isDown ? <TrendingDown className={iconSizes[size]} /> :
        <Minus className={iconSizes[size]} />
      )}
      {formatPercent(value)}
    </span>
  );
}

export { PriceChange };
export type { PriceChangeProps };
