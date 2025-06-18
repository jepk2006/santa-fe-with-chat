export const PAGE_SIZE = 10;
export const LATEST_PRODUCTS_LIMIT = 8;

export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || '';
export const APP_DESCRIPTION = process.env.NEXT_PUBLIC_APP_DESCRIPTION || 'A modern ecommerce store built with Next.js';
export const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'https://santafe.com.bo';

export const SUPABASE_TABLES = {
  PRODUCTS: 'products',
  USERS: 'users',
  ORDERS: 'orders',
  ORDER_ITEMS: 'order_items',
  CARTS: 'carts',
  REVIEWS: 'reviews',
} as const;

export const SUPABASE_POLICIES = {
  PUBLIC: 'public',
  AUTHENTICATED: 'authenticated',
  OWNER: 'owner',
} as const;

export const SUPABASE_ROLES = {
  ADMIN: 'admin',
  USER: 'ventas',
} as const;

export const USER_ROLES = ['admin', 'ventas'] as const;

export const shippingAddressDefaultValues = {
  firstName: '',
  lastName: '',
  address: '',
  city: '',
  postalCode: '',
  country: '',
};

export const productDefaultValues = {
  name: '',
  description: '',
  price: 0,
  images: [],
  category: '',
  countInStock: 0,
  isFeatured: false,
}; 