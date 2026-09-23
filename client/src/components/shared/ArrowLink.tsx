import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

/** "Tümünü gör →" tarzı CTA — varsayılan altın, hover'da ok ilerler (site geneli) */
export function ArrowLink({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  return (
    <Link
      href={href}
      className={cn(
        'group inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-primary decoration-primary/40 underline-offset-4 hover:underline',
        className,
      )}
    >
      {children}
      <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
    </Link>
  );
}
