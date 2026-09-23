'use client';

import { useState } from 'react';
import { Check, Link2, Share2 } from 'lucide-react';

/** Paylaş: destekleyen cihazda yerel paylaşım menüsü, değilse bağlantıyı kopyala */
export function ArticleShare({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);
  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* kullanıcı iptal etti */
    }
  }
  return (
    <button
      type="button"
      onClick={share}
      className="inline-flex h-9 items-center gap-2 rounded-full border border-border px-3.5 text-[13px] text-muted-foreground transition-colors hover:border-primary/60 hover:text-foreground"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-up" aria-hidden="true" /> : typeof navigator !== 'undefined' && 'share' in navigator ? <Share2 className="h-3.5 w-3.5" aria-hidden="true" /> : <Link2 className="h-3.5 w-3.5" aria-hidden="true" />}
      {copied ? 'Bağlantı kopyalandı' : 'Paylaş'}
    </button>
  );
}
