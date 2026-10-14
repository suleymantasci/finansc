'use client';

import { useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import type { AuthUser } from '@/types';

let restoreInFlight: Promise<void> | null = null;

export function AuthSession() {
  useEffect(() => {
    // Remove credentials persisted by earlier releases.
    try { localStorage.removeItem('finanscozum-auth'); } catch { /* unavailable storage */ }
    for (const name of ['finanscozum-token', 'finanscozum-role']) {
      document.cookie = `${name}=; path=/; Max-Age=0; SameSite=Lax`;
    }
    restoreInFlight ??= api.get<AuthUser>('/api/auth/me')
      .then((user) => { useAuthStore.getState().setAuth(user); })
      .catch(() => { useAuthStore.getState().clearAuth(); })
      .finally(() => { restoreInFlight = null; });
  }, []);
  return null;
}
