'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  selling_method: 'unit' | 'weight'; // Use snake_case for consistency with API
  weight_unit?: string;
  weight?: number | null;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  updateQuantity: (id: string, quantity: number) => void;
  updateWeight: (id: string, weight: number) => void;
}

export const useCart = create<CartStore>()(
  persist(
    (set) => ({
      items: [],
      addItem: (item) =>
        set((state) => {
          const existingItem = state.items.find((i) => i.id === item.id);
          
          // If item already exists in cart
          if (existingItem) {
            return {
              items: state.items.map((i) => {
                if (i.id === item.id) {
                  // Weight-based products: add the weights
                  if (item.selling_method === 'weight' && item.weight) {
                    const currentWeight = i.weight || 0;
                    const newWeight = item.weight;
                    return { 
                      ...i, 
                      weight: currentWeight + newWeight 
                    };
                  }
                  // Unit-based products: add the quantities
                  else {
                    return { 
                      ...i, 
                      quantity: i.quantity + item.quantity 
                    };
                  }
                }
                return i;
              }),
            };
          }
          
          // New item not in cart
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
            item.id === id ? { ...item, weight } : item
          ),
        })),
    }),
    {
      name: 'cart-storage',
    }
  )
); 