import { create } from 'zustand';

interface UserStore {
  favorites: string[]; // 餐厅ID
  toggleFavorite: (restaurantId: string) => void;
  isFavorite: (restaurantId: string) => boolean;
}

export const useUserStore = create<UserStore>((set, get) => ({
  favorites: ['1', '3', '5'],

  toggleFavorite: (restaurantId: string) => {
    set((state) => {
      const isFav = state.favorites.includes(restaurantId);
      return {
        favorites: isFav
          ? state.favorites.filter((id) => id !== restaurantId)
          : [...state.favorites, restaurantId],
      };
    });
  },

  isFavorite: (restaurantId: string) => {
    return get().favorites.includes(restaurantId);
  },
}));
