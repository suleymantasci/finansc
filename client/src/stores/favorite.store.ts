import { create } from 'zustand';
import { api } from '@/lib/api';
import type { Favorite, FavoriteType } from '@/types';

interface FavoriteState {
  favorites: Favorite[];
  loading: boolean;
  /** Bu oturumda en az bir kez sunucudan çekildi mi */
  loaded: boolean;
  fetchFavorites: () => Promise<void>;
  addFavorite: (type: FavoriteType, symbol: string) => Promise<boolean>;
  removeFavorite: (id: string) => Promise<boolean>;
  findFavorite: (type: FavoriteType, symbol: string) => Favorite | undefined;
  reset: () => void;
}

export const useFavoriteStore = create<FavoriteState>((set, get) => ({
  favorites: [],
  loading: false,
  loaded: false,

  fetchFavorites: async () => {
    if (get().loading) return;
    set({ loading: true });
    try {
      const data = await api.get<Favorite[]>('/api/favorites');
      set({ favorites: Array.isArray(data) ? data : [], loading: false, loaded: true });
    } catch {
      set({ loading: false, loaded: true });
    }
  },

  addFavorite: async (type, symbol) => {
    try {
      const fav = await api.post<Favorite>('/api/favorites', { type, symbol });
      set((s) => ({ favorites: [...s.favorites.filter((f) => f.id !== fav.id), fav] }));
      return true;
    } catch {
      return false;
    }
  },

  removeFavorite: async (id) => {
    const prev = get().favorites;
    set({ favorites: prev.filter((f) => f.id !== id) });
    try {
      await api.delete('/api/favorites/' + id);
      return true;
    } catch {
      set({ favorites: prev });
      return false;
    }
  },

  findFavorite: (type, symbol) => get().favorites.find((f) => f.type === type && f.symbol === symbol),

  reset: () => set({ favorites: [], loaded: false }),
}));
