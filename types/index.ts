import { z } from 'zod';
import {
  insertProductSchema,
  insertCartSchema,
  cartItemSchema,
  shippingAddressSchema,
  insertOrderItemSchema,
  insertOrderSchema,
  insertReviewSchema,
} from '@/lib/validators';

export type Product = {
  id: string;
  name: string;
  slug: string;
  category: string;
  brand: string;
  description: string;
  inStock: boolean;
  images: string[];
  isFeatured: boolean;
  banner: string | null;
  price: number;
  selling_method?: 'unit' | 'weight_custom' | 'weight_fixed';
  createdAt: string;
  updatedAt: string;
};

export type Cart = z.infer<typeof insertCartSchema>;
export type CartItem = z.infer<typeof cartItemSchema>;
export type ShippingAddress = z.infer<typeof shippingAddressSchema>;
export type OrderItem = z.infer<typeof insertOrderItemSchema>;
export type Order = z.infer<typeof insertOrderSchema> & {
  id: string;
  created_at: Date;
  updated_at: Date;
  user: { name: string; email: string };
};
export type Review = z.infer<typeof insertReviewSchema> & {
  id: string;
  created_at: Date;
  user: { name: string };
};
