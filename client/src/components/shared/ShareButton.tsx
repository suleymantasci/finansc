'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { copyText } from '@/lib/clipboard';

interface ShareButtonProps {
  /** Kopyalanacak absolute URL */
  shareUrl: string;
  className?: string;
  label?: string;
}

/**
 * ShareButton — hesaplama sonucu için "Sonucu Paylaş" butonu.
 * Tıklanınca shareUrl'i clipboard'a kopyalar, 2 saniye feedback gösterir.
 */
export function ShareButton({ shareUrl, className, label = 'Sonucu Paylaş' }: ShareButtonProps) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle');

  const handleClick = async () => {
    setState((await copyText(shareUrl)) ? 'copied' : 'failed');
    setTimeout(() => setState('idle'), 2000);
  };

  const Icon = state === 'copied' ? Check : Copy;

  return (
    <button
      type="button"
      onClick={handleClick}
      title={shareUrl}
      className={cn(
        'inline-flex items-center gap-1.5 atlas-card px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted',
        state === 'copied' && 'border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-400',
        state === 'failed' && 'border-red-500/50 bg-red-500/10 text-red-700 dark:text-red-400',
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {state === 'idle' && label}
      {state === 'copied' && 'Kopyalandı ✓'}
      {state === 'failed' && 'Kopyalanamadı'}
    </button>
  );
}
