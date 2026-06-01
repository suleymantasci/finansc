import { create } from 'zustand';
import { api } from '@/lib/api';

interface AdSlotConfig {
  id: string;
  page: string;
  position: string;
  slotIndex: number;
  adsenseUnit: string | null;
  isActive: boolean;
}

interface AdState {
  slots: AdSlotConfig[];
  loaded: boolean;
  fetchAdConfig: () => Promise<void>;
  getSlot: (page: string, position: string, slotIndex: number) => AdSlotConfig | undefined;
}

export const useAdStore = create<AdState>((set, get) => ({
  slots: [],
  loaded: false,

  fetchAdConfig: async () => {
    try {
      const data = await api.get<AdSlotConfig[]>('/api/ads/config');
      set({ slots: data, loaded: true });
    } catch {
      set({ loaded: true });
    }
  },

  getSlot: (page, position, slotIndex) => {
    return get().slots.find(
      (s) => s.page === page && s.position === position && s.slotIndex === slotIndex,
    );
  },
}));
