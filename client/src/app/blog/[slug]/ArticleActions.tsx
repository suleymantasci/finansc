'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Link2, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { copyText } from '@/lib/clipboard';


const TARGETS: { label: string; href: (u: string, t: string) => string }[] = [
  { label: 'WhatsApp', href: (u, t) => `https://wa.me/?text=${encodeURIComponent(`${t} ${u}`)}` },
  { label: 'X', href: (u, t) => `https://x.com/intent/post?url=${encodeURIComponent(u)}&text=${encodeURIComponent(t)}` },
  { label: 'LinkedIn', href: (u) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(u)}` },
  { label: 'Facebook', href: (u) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(u)}` },
  { label: 'Telegram', href: (u, t) => `https://t.me/share/url?url=${encodeURIComponent(u)}&text=${encodeURIComponent(t)}` },
];

/** Paylaş: mobilde yerel paylaşım menüsü, diğer durumlarda sosyal ağlar + bağlantı kopyalama menüsü */
export function ArticleShare({ title }: { title: string }) {
  const [open, setOpen] = useState(false);
  const [copy, setCopy] = useState<'idle' | 'ok' | 'fail'>('idle');
  const [url, setUrl] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => setUrl(window.location.href.split('#')[0]), []);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  async function onShare() {
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    if (coarse && typeof navigator.share === 'function') {
      try {
        await navigator.share({ title, url });
        return;
      } catch (e) {
        if ((e as Error)?.name === 'AbortError') return;
      }
    }
    setOpen((v) => !v);
  }

  async function onCopy() {
    const ok = await copyText(url);
    setCopy(ok ? 'ok' : 'fail');
    setTimeout(() => setCopy('idle'), 2000);
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={onShare}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex h-9 items-center gap-2 rounded-full border border-border px-3.5 text-[13px] text-muted-foreground transition-colors hover:border-primary/60 hover:text-foreground"
      >
        <Share2 className="h-3.5 w-3.5" aria-hidden="true" />
        Paylaş
      </button>
      {open && (
        <div role="menu" className="atlas-card absolute left-1/2 top-full z-30 mt-2 w-56 -translate-x-1/2 p-1.5 text-left shadow-lg">
          {TARGETS.map((t) => (
            <a
              key={t.label}
              role="menuitem"
              href={t.href(url, title)}
              target="_blank"
              rel="noopener noreferrer nofollow"
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-2 text-sm text-foreground transition-colors hover:bg-surface-hover hover:text-primary"
            >
              {t.label}
            </a>
          ))}
          <div className="my-1 border-t border-border" />
          <button
            type="button"
            role="menuitem"
            onClick={onCopy}
            className={cn(
              'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-surface-hover',
              copy === 'ok' ? 'text-up' : copy === 'fail' ? 'text-down' : 'text-foreground',
            )}
          >
            {copy === 'ok' ? <Check className="h-4 w-4" aria-hidden="true" /> : <Link2 className="h-4 w-4" aria-hidden="true" />}
            {copy === 'ok' ? 'Bağlantı kopyalandı' : copy === 'fail' ? 'Kopyalanamadı' : 'Bağlantıyı kopyala'}
          </button>
        </div>
      )}
    </div>
  );
}
