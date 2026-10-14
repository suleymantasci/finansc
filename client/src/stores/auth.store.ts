import { create } from 'zustand';
import type { AuthUser } from '@/types';

interface AuthState {
  user: AuthUser | null;
  setAuth: (user: AuthUser) => void;
  updateUser: (updates: Partial<AuthUser>) => void;
  clearAuth: () => void;
  isAuthenticated: () => boolean;
  isAdmin: () => boolean;
}

// Credentials live exclusively in server-set HttpOnly cookies.
export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  setAuth: (user) => set({ user }),
  updateUser: (updates) => {
    const current = get().user;
    if (current) set({ user: { ...current, ...updates } });
  },
  clearAuth: () => set({ user: null }),
  isAuthenticated: () => !!get().user,
  isAdmin: () => get().user?.role === 'admin',
}));
