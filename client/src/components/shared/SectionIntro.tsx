import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SectionIntroProps {
  title: string;
  description?: string;
  ctaLabel?: string;
  ctaHref?: string;
  className?: string;
  /**
   * "page" (default) → server-side H1, used on listing pages as the primary SEO heading.
   * "section" → H2, used as a sub-section heading inside a page.
   */
  as?: 'page' | 'section';
}

function SectionIntro({ title, description, ctaLabel, ctaHref, className, as = 'page' }: SectionIntroProps) {
  const headingClass = cn(
    'font-bold tracking-tight',
    as === 'page'
      ? 'text-2xl lg:text-3xl'
      : 'text-2xl lg:text-3xl',
  );
  const descClass = cn(
    'mt-1 text-muted-foreground',
    as === 'page' ? 'text-sm max-w-3xl' : 'text-base lg:text-lg',
  );
  const HeadingTag = as === 'page' ? 'h1' : 'h2';

  return (
    <div className={cn('mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div className={as === 'page' ? 'flex-1' : 'max-w-2xl'}>
        <HeadingTag className={headingClass}>{title}</HeadingTag>
        {description && (
          <p className={descClass}>
            {description}
          </p>
        )}
      </div>
      {ctaLabel && ctaHref && (
        <Link
          href={ctaHref}
          className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-primary transition-colors hover:underline"
        >
          {ctaLabel}
          <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}

export { SectionIntro };
export type { SectionIntroProps };
