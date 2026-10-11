import { create } from 'zustand';
import type { Order } from '../types';

interface OrderStore {
  orders: Order[];
  addOrder: (order: Order) => void;
  updateOrderStatus: (orderId: string, status: Order['status']) => void;
  getOrderById: (orderId: string) => Order | undefined;
  getOrders: () => Order[];
}

export const useOrderStore = create<OrderStore>((set, get) => ({
  orders: [],

  addOrder: (order: Order) => {
    set((state) => ({
      orders: [order, ...state.orders],
    }));
  },

  updateOrderStatus: (orderId: string, status: Order['status']) => {
    set((state) => ({
      orders: state.orders.map((order) =>
        order.id === orderId ? { ...order, status } : order
      ),
    }));
  },

  getOrderById: (orderId: string) => {
    return get().orders.find((order) => order.id === orderId);
  },

  getOrders: () => {
    return get().orders;
  },
}));
