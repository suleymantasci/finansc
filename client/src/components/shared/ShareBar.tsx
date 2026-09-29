'use client';

import { useEffect, useState } from 'react';
import { Check, Link2, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { copyText } from '@/lib/clipboard';

interface ShareBarProps {
  /** Paylaşılacak link; verilmezse tıklama anındaki sayfa adresi kullanılır */
  getUrl?: () => string;
  /** Paylaşım metni (başlık + sonuç özeti) */
  text: string;
  title?: string;
  className?: string;
  compact?: boolean;
}

// lucide sürümünde marka ikonları yok; hafif inline SVG yolları
const ICONS = {
  whatsapp: 'M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm5.8 14.1c-.24.68-1.42 1.3-1.95 1.34-.5.05-.97.23-3.27-.68-2.77-1.09-4.52-3.94-4.66-4.12-.13-.18-1.1-1.47-1.1-2.8 0-1.33.7-1.99.95-2.26.24-.27.53-.34.71-.34h.51c.16 0 .38-.06.6.46.23.54.77 1.87.84 2 .07.14.11.3.02.48-.09.18-.14.3-.27.46-.14.16-.29.36-.41.48-.14.14-.28.29-.12.56.16.27.7 1.16 1.51 1.88 1.04.93 1.91 1.21 2.18 1.35.27.14.43.11.59-.07.16-.18.68-.79.86-1.07.18-.27.36-.23.61-.14.25.09 1.57.74 1.84.88.27.13.45.2.52.31.07.11.07.64-.17 1.32Z',
  x: 'M17.75 3h3.07l-6.7 7.66L22 21h-6.17l-4.83-6.32L5.47 21H2.4l7.17-8.2L2 3h6.33l4.37 5.77L17.75 3Zm-1.08 16.2h1.7L7.4 4.73H5.58L16.67 19.2Z',
  facebook: 'M13.5 21v-7.5h2.53l.38-2.94H13.5V8.68c0-.85.24-1.43 1.46-1.43h1.56V4.62a20.9 20.9 0 0 0-2.27-.12c-2.25 0-3.79 1.37-3.79 3.9v2.16H7.9v2.94h2.55V21h3.05Z',
  linkedin: 'M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9.75h4v11.25H3V9.75Zm6.5 0h3.83v1.54h.05c.53-1.01 1.84-2.07 3.79-2.07 4.05 0 4.8 2.66 4.8 6.13V21h-4v-5.02c0-1.2-.02-2.74-1.67-2.74-1.67 0-1.93 1.3-1.93 2.65V21h-4V9.75Z',
  telegram: 'M21.9 4.3 18.7 19.4c-.24 1.07-.87 1.33-1.77.83l-4.88-3.6-2.36 2.27c-.26.26-.48.48-.98.48l.35-4.97 9.05-8.18c.39-.35-.09-.55-.61-.2L6.4 13.07l-4.82-1.5c-1.05-.33-1.07-1.05.22-1.55l18.84-7.26c.87-.32 1.64.2 1.36 1.54Z',
} as const;

type Network = keyof typeof ICONS;

const NETWORKS: { id: Network; label: string; href: (u: string, t: string) => string }[] = [
  { id: 'whatsapp', label: 'WhatsApp', href: (u, t) => `https://wa.me/?text=${encodeURIComponent(`${t}\n${u}`)}` },
  { id: 'x', label: 'X', href: (u, t) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(t)}&url=${encodeURIComponent(u)}` },
  { id: 'facebook', label: 'Facebook', href: (u) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(u)}` },
  { id: 'linkedin', label: 'LinkedIn', href: (u) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(u)}` },
  { id: 'telegram', label: 'Telegram', href: (u, t) => `https://t.me/share/url?url=${encodeURIComponent(u)}&text=${encodeURIComponent(t)}` },
];

/**
 * Sonuç paylaşım çubuğu. Mobilde sistem paylaşım menüsü (navigator.share), ayrıca
 * WhatsApp, X, Facebook, LinkedIn, Telegram ve link kopyalama. Link, hesaplamadaki
 * değerleri içerir; açan kişi aynı sonucu görür.
 */
export function ShareBar({ getUrl, text, title, className, compact = false }: ShareBarProps) {
  const [copied, setCopied] = useState<'idle' | 'ok' | 'fail'>('idle');
  const [canNative, setCanNative] = useState(false);

  useEffect(() => {
    setCanNative(typeof navigator !== 'undefined' && typeof navigator.share === 'function');
  }, []);

  const url = () => (getUrl ? getUrl() : window.location.href);

  const native = async () => {
    try {
      await navigator.share({ title: title ?? document.title, text, url: url() });
    } catch { /* kullanıcı iptal etti */ }
  };

  const copy = async () => {
    setCopied((await copyText(url())) ? 'ok' : 'fail');
    setTimeout(() => setCopied('idle'), 2000);
  };

  const open = (n: (typeof NETWORKS)[number]) => {
    window.open(n.href(url(), text), '_blank', 'noopener,noreferrer,width=640,height=560');
  };

  const btn = 'inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-border bg-elevated px-3 text-xs font-medium text-foreground transition-colors hover:border-primary/60 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40';

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)} aria-label="Sonucu paylaş">
      {!compact && <span className="mr-1 text-xs text-muted-foreground">Paylaş:</span>}
      {canNative && (
        <button type="button" onClick={native} className={cn(btn, 'border-primary/50 text-primary')}>
          <Share2 className="h-3.5 w-3.5" aria-hidden="true" /> Paylaş
        </button>
      )}
      {NETWORKS.map((n) => (
        <button key={n.id} type="button" onClick={() => open(n)} className={cn(btn, 'w-9 px-0')} aria-label={`${n.label} ile paylaş`} title={`${n.label} ile paylaş`}>
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true"><path d={ICONS[n.id]} /></svg>
        </button>
      ))}
      <button
        type="button"
        onClick={copy}
        className={cn(btn, copied === 'ok' && 'border-up/50 text-up', copied === 'fail' && 'border-down/50 text-down')}
      >
        {copied === 'ok' ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <Link2 className="h-3.5 w-3.5" aria-hidden="true" />}
        {copied === 'ok' ? 'Kopyalandı' : copied === 'fail' ? 'Kopyalanamadı' : 'Linki kopyala'}
      </button>
    </div>
  );
}
