import Link from 'next/link';
import { cn } from '@/lib/utils';

/**
 * Marka işareti: iki yatay çizgili açık halka — ₺ ve € sembollerinin ortak
 * geometrisinden türetildi. Wordmark editoryal serif.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={cn('h-7 w-7', className)}>
      <path
        d="M24.5 8.2A11 11 0 1 0 24.5 23.8"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path d="M5 13.4h14.5M5 18.6h14.5" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="FinansÇözüm ana sayfa"
      className={cn('group flex items-center gap-2.5 text-foreground', className)}
    >
      <LogoMark className="text-primary transition-transform duration-300 group-hover:-rotate-12" />
      <span className="font-display text-[1.6rem] leading-none tracking-tight">
        Finans<span className="text-primary">Çözüm</span>
      </span>
    </Link>
  );
}
