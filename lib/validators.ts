import { z } from 'zod';
import { formatNumberWithDecimal } from './utils';

const USER_ROLES = ['admin', 'ventas'] as const;

const currency = z
  .string()
  .refine(
    (value) => /^\d+(\.\d{2})?$/.test(formatNumberWithDecimal(Number(value))),
    'Price must have exactly two decimal places'
  );

// Available selling methods
export const SELLING_METHODS = ['unit', 'weight'] as const;
export type SellingMethod = typeof SELLING_METHODS[number];

// Available weight units
export const WEIGHT_UNITS = ['kg', 'g', 'lb', 'oz'] as const;
export type WeightUnit = typeof WEIGHT_UNITS[number];

// Schema for inserting products
export const insertProductSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required'),
  description: z.string().min(1, 'Description is required'),
  price: z.coerce.number().min(0, 'Price must be a positive number'),
  selling_method: z.enum(SELLING_METHODS).default('unit'),
  weight_unit: z.enum(WEIGHT_UNITS).optional().nullable(),
  min_weight: z.coerce.number().min(0).optional().nullable(),
  in_stock: z.boolean().default(true),
  rating: z.coerce.number().min(0).max(5, 'Rating must be between 0 and 5'),
  num_reviews: z.coerce.number().int().min(0, 'Number of reviews must be a positive number'),
  is_featured: z.boolean().default(false),
  images: z.array(z.string()).min(1, 'At least one image is required'),
  category: z.string().min(1, 'Category is required'),
  brand: z.string().min(1, 'Brand is required'),
  banner: z.string().nullable().optional(),
});

// Schema for updating products
export const updateProductSchema = insertProductSchema.extend({
  id: z.string().uuid('Invalid product ID'),
}).partial();

export type InsertProduct = z.infer<typeof insertProductSchema>;
export type UpdateProduct = z.infer<typeof updateProductSchema>;

// Cart Schemas
export const cartItemSchema = z.object({
  id: z.string().min(1, 'Product is required'),
  name: z.string().min(1, 'Name is required'),
  quantity: z.number().nonnegative('Quantity must be a positive number'),
  image: z.string().min(1, 'Image is required'),
  price: z.number().nonnegative('Price must be a positive number'),
  selling_method: z.enum(SELLING_METHODS).default('unit'),
  weight_unit: z.enum(WEIGHT_UNITS).optional().nullable(),
  weight: z.number().optional().nullable(),
});

export const insertCartSchema = z.object({
  user_id: z.string().min(1, 'User is required'),
  items: z.array(cartItemSchema),
  is_paid: z.boolean().default(false).optional(),
  paid_at: z.string().datetime({ offset: true }).nullable().optional(),
  is_delivered: z.boolean().default(false).optional(),
  delivered_at: z.string().datetime({ offset: true }).nullable().optional(),
  status: z.enum(['pending', 'paid', 'shipped', 'delivered', 'cancelled']).optional(),
});

// Schema for the shipping address
export const shippingAddressSchema = z.object({
  firstName: z.string().min(3, 'First name must be at least 3 characters'),
  lastName: z.string().min(3, 'Last name must be at least 3 characters'),
  address: z.string().min(3, 'Address must be at least 3 characters'),
  city: z.string().min(3, 'City must be at least 3 characters'),
  postalCode: z.string().min(3, 'Postal code must be at least 3 characters'),
  country: z.string().min(3, 'Country must be at least 3 characters'),
});

// Schema for inserting order
export const insertOrderSchema = z.object({
  user_id: z.string().min(1, 'User is required'),
  items: z.array(cartItemSchema),
  total_price: z.number().nonnegative('Total price must be a positive number'),
  shipping_address: shippingAddressSchema,
  status: z.enum(['pending', 'paid', 'shipped', 'delivered', 'cancelled']),
  is_paid: z.boolean().default(false),
  paid_at: z.string().datetime({ offset: true }).nullable().optional(),
  is_delivered: z.boolean().default(false),
  delivered_at: z.string().datetime({ offset: true }).nullable().optional(),
});

// Schema for inserting an order item
export const insertOrderItemSchema = z.object({
  product_id: z.string(),
  name: z.string(),
  price: z.number(),
  quantity: z.number(),
  image: z.string(),
});

// Schema for updating the user profile
export const updateProfileSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
});

// Schema to create users
export const createUserSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  phone_number: z.string().optional().refine(
    (val) => !val || /^\(\d\) \d{3}-\d{4}$/.test(val), 
    "Phone number must be in format (7) 123-4567"
  ),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  role: z.enum(USER_ROLES, {
    errorMap: () => ({ message: 'Invalid role' }),
  }),
});

// Schema to update users
export const updateUserSchema = updateProfileSchema.extend({
  id: z.string().min(1, 'ID is required'),
  phone_number: z.string().optional().refine(
    (val) => !val || /^\(\d\) \d{3}-\d{4}$/.test(val), 
    "Phone number must be in format (7) 123-4567"
  ),
  role: z.enum(USER_ROLES, {
    errorMap: () => ({ message: 'Invalid role' }),
  }),
});

// Schema to insert reviews
export const insertReviewSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(3, 'Description must be at least 3 characters'),
  product_id: z.string().min(1, 'Product is required'),
  user_id: z.string().min(1, 'User is required'),
  rating: z.coerce
    .number()
    .int()
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating must be at most 5'),
});
