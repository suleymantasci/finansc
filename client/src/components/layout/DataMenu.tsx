'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { NavItem } from '@/lib/constants';

interface DataMenuProps {
  items: readonly NavItem[];
  pathname: string;
}

export function DataMenu({ items, pathname }: DataMenuProps) {
  return (
    <>
      {items.map((item) => {
        const isDropdown = 'children' in item;
        if (!isDropdown) {
          // Düz link — mevcut davranış
          const direct = item as Extract<NavItem, { href: string }>;
          const isActive = pathname === direct.href || pathname.startsWith(direct.href + '/');
          return (
            <Link
              key={direct.href}
              href={direct.href}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'relative px-3 py-2 text-sm transition-colors after:absolute after:inset-x-3 after:-bottom-[1px] after:h-px after:origin-left after:bg-primary after:transition-transform',
                isActive
                  ? 'text-foreground after:scale-x-100'
                  : 'text-muted-foreground after:scale-x-0 hover:text-foreground hover:after:scale-x-100',
              )}
            >
              {direct.label}
            </Link>
          );
        }
        return <DesktopDropdown key={item.label} item={item} pathname={pathname} />;
      })}
    </>
  );
}

function DesktopDropdown({
  item,
  pathname,
}: {
  item: Extract<NavItem, { children: any }>;
  pathname: string;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isChildActive = item.children.some(
    (c: { href: string }) => pathname === c.href || pathname.startsWith(c.href + '/'),
  );

  function handleEnter() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
  }
  function handleLeave() {
    closeTimer.current = setTimeout(() => setOpen(false), 120);
  }

  // Dışarı tıklama kapatma
  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="true"
        className={cn(
          'flex items-center gap-1 px-3 py-2 text-sm transition-colors',
          isChildActive || open ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
        )}
      >
        {item.label}
        <ChevronDown
          className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-180')}
        />
      </button>

      {open && (
        <div
          role="menu"
          // z-50 yeterli değildi — Tailwind v4'te bg-popover token yok.
          // bg-card + backdrop-blur + ring ile net arka plan sağla.
          className="absolute left-0 top-full z-[100] mt-2 min-w-[280px] rounded-xl border border-border bg-elevated p-1.5 shadow-2xl"
        >
          {item.children.map((child: { label: string; href: string; description?: string }) => {
            const active = pathname === child.href || pathname.startsWith(child.href + '/');
            return (
              <Link
                key={child.href}
                href={child.href}
                role="menuitem"
                onClick={() => setOpen(false)}
                className={cn(
                  'block rounded-md px-3 py-2 transition-colors',
                  active
                    ? 'bg-primary/10 text-primary'
                    : 'text-foreground hover:bg-surface-hover',
                )}
              >
                <div className="text-sm font-medium">{child.label}</div>
                {child.description && (
                  <div className="mt-0.5 text-xs text-muted-foreground">{child.description}</div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}