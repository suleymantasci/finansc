import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

type Status = 'connected' | 'connecting' | 'disconnected';

interface MarketStatusProps {
  status: Status;
  label?: string;
  className?: string;
}

const statusConfig: Record<Status, { icon: typeof Wifi; color: string; text: string }> = {
  connected: { icon: Wifi, color: 'text-up', text: 'Canlı' },
  connecting: { icon: RefreshCw, color: 'text-primary', text: 'Bağlanıyor...' },
  disconnected: { icon: WifiOff, color: 'text-down', text: 'Bağlantı kesildi' },
};

function MarketStatus({ status, label, className }: MarketStatusProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className={cn('inline-flex items-center gap-1.5 text-xs', className)}>
      <Icon className={cn('h-3 w-3', config.color, status === 'connecting' && 'animate-spin')} />
      <span className={cn('font-medium', config.color)}>
        {label || config.text}
      </span>
    </div>
  );
}

export { MarketStatus };
export type { MarketStatusProps, Status as MarketConnectionStatus };
