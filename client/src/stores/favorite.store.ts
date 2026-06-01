import { create } from 'zustand';
import { api } from '@/lib/api';
import type { Favorite } from '@/types';

interface FavoriteState {
  favorites: Favorite[];
  loading: boolean;
  fetchFavorites: () => Promise<void>;
  addFavorite: (type: 'stock' | 'gold', symbol: string) => Promise<void>;
  removeFavorite: (id: string) => Promise<void>;
  isFavorite: (type: 'stock' | 'gold', symbol: string) => boolean;
}

export const useFavoriteStore = create<FavoriteState>((set, get) => ({
  favorites: [],
  loading: false,

  fetchFavorites: async () => {
    set({ loading: true });
    try {
      const data = await api.get<Favorite[]>('/api/favorites');
      set({ favorites: data, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  addFavorite: async (type, symbol) => {
    try {
      const fav = await api.post<Favorite>('/api/favorites', { type, symbol });
      set((s) => ({ favorites: [...s.favorites, fav] }));
    } catch {
      // silent
    }
  },

  removeFavorite: async (id) => {
    try {
      await api.delete('/api/favorites/' + id);
      set((s) => ({ favorites: s.favorites.filter((f) => f.id !== id) }));
    } catch {
      // silent
    }
  },

  isFavorite: (type, symbol) => {
    return get().favorites.some((f) => f.type === type && f.symbol === symbol);
  },
}));
