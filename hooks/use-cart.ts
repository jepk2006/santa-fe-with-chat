'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  selling_method: 'unit' | 'weight_custom' | 'weight_fixed'; // Use snake_case for consistency with API
  weight_unit?: string;
  weight?: number | null;
  locked?: boolean;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  updateQuantity: (id: string, quantity: number) => void;
  updateWeight: (id: string, weight: number) => void;
  setItems: (items: CartItem[]) => void;
}

export const useCart = create<CartStore>()(
  persist(
    (set) => ({
      items: [],
      setItems: (items) => set({ items }),
      addItem: (item) =>
        set((state) => {
          const existingItem = state.items.find((i) => i.id === item.id);

          // If exact unit already exists and is locked, ignore duplicate
          if (existingItem && existingItem.locked) {
            return state; // no change
          }

          // If item already exists and is NOT locked, merge as before
          if (existingItem) {
            return {
              items: state.items.map((i) => {
                if (i.id === item.id) {
                  // Weight-based products: add weights
                  if ((item.selling_method === 'weight_custom' || item.selling_method === 'weight_fixed') && item.weight) {
                    const currentWeight = i.weight || 0;
                    return { ...i, weight: currentWeight + item.weight };
                  }
                  // Unit-based products: accumulate quantity
                  return { ...i, quantity: i.quantity + item.quantity };
                }
                return i;
              }),
            };
          }

          // Item not yet in cart
          return { items: [...state.items, item] };
        }),
      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        })),
      clearCart: () => set({ items: [] }),
      updateQuantity: (id, quantity) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, quantity } : item
          ),
        })),
      updateWeight: (id, weight) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id && !item.locked ? { ...item, weight } : item
          ),
        })),
    }),
    {
      name: 'cart-storage',
    }
  )
); 