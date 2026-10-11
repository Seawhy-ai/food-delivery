import { create } from 'zustand';
import type { Address } from '../types';
import { mockAddresses } from '../mockData';

interface AddressStore {
  addresses: Address[];
  defaultAddress: Address | null;
  addAddress: (address: Address) => void;
  updateAddress: (id: string, address: Address) => void;
  deleteAddress: (id: string) => void;
  setDefaultAddress: (id: string) => void;
  getDefaultAddress: () => Address | null;
}

export const useAddressStore = create<AddressStore>((set, get) => ({
  addresses: mockAddresses,
  defaultAddress: mockAddresses.find((a) => a.isDefault) || mockAddresses[0],

  addAddress: (address: Address) => {
    set((state) => ({
      addresses: [...state.addresses, address],
    }));
  },

  updateAddress: (id: string, address: Address) => {
    set((state) => ({
      addresses: state.addresses.map((a) => (a.id === id ? address : a)),
    }));
  },

  deleteAddress: (id: string) => {
    set((state) => ({
      addresses: state.addresses.filter((a) => a.id !== id),
    }));
  },

  setDefaultAddress: (id: string) => {
    set((state) => {
      const newAddresses = state.addresses.map((a) => ({
        ...a,
        isDefault: a.id === id,
      }));
      return {
        addresses: newAddresses,
        defaultAddress: newAddresses.find((a) => a.id === id) || null,
      };
    });
  },

  getDefaultAddress: () => {
    return get().defaultAddress;
  },
}));
