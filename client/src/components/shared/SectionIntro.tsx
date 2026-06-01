import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SectionIntroProps {
  title: string;
  description?: string;
  ctaLabel?: string;
  ctaHref?: string;
  className?: string;
}

function SectionIntro({ title, description, ctaLabel, ctaHref, className }: SectionIntroProps) {
  return (
    <div className={cn('mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div className="max-w-2xl">
        <h2 className="text-2xl font-bold tracking-tight lg:text-3xl">{title}</h2>
        {description && (
          <p className="mt-1 text-base text-muted-foreground lg:text-lg">
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
