'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Star } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { useFavoriteStore } from '@/stores/favorite.store';
import type { FavoriteType } from '@/types';
import { cn } from '@/lib/utils';

/**
 * Favorilere ekle/çıkar. Giriş yoksa giriş sayfasına (dönüş adresiyle) yönlendirir.
 */
export function FavoriteButton({ type, symbol, label, className }: { type: FavoriteType; symbol: string; label: string; className?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const { loaded, fetchFavorites, addFavorite, removeFavorite } = useFavoriteStore();
  const fav = useFavoriteStore((s) => s.favorites.find((f) => f.type === type && f.symbol === symbol));
  const [busy, setBusy] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (user && !loaded) fetchFavorites();
  }, [user, loaded, fetchFavorites]);

  const active = mounted && !!fav;

  async function toggle() {
    if (!user) {
      router.push(`/giris?from=${encodeURIComponent(pathname || '/')}`);
      return;
    }
    setBusy(true);
    if (fav) await removeFavorite(fav.id);
    else await addFavorite(type, symbol);
    setBusy(false);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      aria-pressed={active}
      aria-label={active ? `${label} favorilerden çıkar` : `${label} favorilere ekle`}
      title={user ? undefined : 'Favorilere eklemek için giriş yapın'}
      className={cn(
        'inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors disabled:opacity-60',
        active ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card/60 text-foreground hover:border-primary/60',
        className,
      )}
    >
      <Star className={cn('h-4 w-4', active && 'fill-current')} aria-hidden="true" />
      <span>{active ? 'Favorilerde' : 'Favorilere ekle'}</span>
    </button>
  );
}
