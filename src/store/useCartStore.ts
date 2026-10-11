import { create } from 'zustand';
import type { Cart, CartItem } from '../types';

interface CartStore {
  cart: Cart | null;
  addItem: (restaurantId: string, item: CartItem) => void;
  removeItem: (dishId: string) => void;
  updateQuantity: (dishId: string, quantity: number) => void;
  clearCart: () => void;
  setRestaurant: (restaurantId: string) => void;
  getTotal: () => number;
}

export const useCartStore = create<CartStore>((set, get) => ({
  cart: null,

  addItem: (restaurantId: string, item: CartItem) => {
    set((state) => {
      // 如果当前购物车为空或是不同餐厅，创建新购物车
      if (!state.cart || state.cart.restaurantId !== restaurantId) {
        return {
          cart: {
            restaurantId,
            items: [item],
          },
        };
      }

      // 如果是同一餐厅，检查是否已存在相同商品
      const existingItem = state.cart.items.find((i) => i.id === item.id);
      if (existingItem) {
        existingItem.quantity += item.quantity;
        return { cart: { ...state.cart } };
      }

      return {
        cart: {
          ...state.cart,
          items: [...state.cart.items, item],
        },
      };
    });
  },

  removeItem: (dishId: string) => {
    set((state) => {
      if (!state.cart) return state;
      return {
        cart: {
          ...state.cart,
          items: state.cart.items.filter((i) => i.id !== dishId),
        },
      };
    });
  },

  updateQuantity: (dishId: string, quantity: number) => {
    set((state) => {
      if (!state.cart) return state;
      const item = state.cart.items.find((i) => i.id === dishId);
      if (item) {
        item.quantity = quantity;
      }
      return { cart: { ...state.cart } };
    });
  },

  clearCart: () => {
    set({ cart: null });
  },

  setRestaurant: (restaurantId: string) => {
    set((state) => {
      if (state.cart?.restaurantId !== restaurantId) {
        return { cart: null };
      }
      return state;
    });
  },

  getTotal: () => {
    const state = get();
    if (!state.cart) return 0;
    return state.cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  },
}));
