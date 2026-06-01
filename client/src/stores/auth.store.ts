import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthUser } from '@/types';

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  setAuth: (user: AuthUser, accessToken: string, refreshToken: string) => void;
  updateUser: (updates: Partial<AuthUser>) => void;
  clearAuth: () => void;
  isAuthenticated: () => boolean;
  isAdmin: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      setAuth: (user, accessToken, refreshToken) => {
        set({ user, accessToken, refreshToken });
        // Set cookies for middleware route protection
        if (typeof document !== 'undefined') {
          document.cookie = `finanscozum-token=${accessToken}; path=/; SameSite=Lax`;
          document.cookie = `finanscozum-role=${user.role}; path=/; SameSite=Lax`;
        }
      },
      updateUser: (updates) => {
        const current = get().user;
        if (current) {
          set({ user: { ...current, ...updates } });
        }
      },
      clearAuth: () => {
        set({ user: null, accessToken: null, refreshToken: null });
        // Clear cookies
        if (typeof document !== 'undefined') {
          document.cookie = 'finanscozum-token=; path=/; Max-Age=0';
          document.cookie = 'finanscozum-role=; path=/; Max-Age=0';
        }
      },
      isAuthenticated: () => !!get().accessToken,
      isAdmin: () => get().user?.role === 'admin',
    }),
    {
      name: 'finanscozum-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    },
  ),
);
