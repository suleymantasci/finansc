import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

type BadgeVariant = 'default' | 'success' | 'danger' | 'warning' | 'outline' | 'secondary';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default:
    'bg-primary/10 text-primary border-primary/20',
  success:
    'bg-success/10 text-success border-success/20',
  danger:
    'bg-destructive/10 text-destructive border-destructive/20',
  warning:
    'bg-primary/10 text-primary border-primary/25',
  outline:
    'bg-transparent text-muted-foreground border-border',
  secondary:
    'bg-muted text-muted-foreground border-border',
};

function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        variantStyles[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}

export { Badge };
export type { BadgeProps, BadgeVariant };
