'use server';

import { PostgrestError } from '@supabase/supabase-js';
import { AppError } from '../types/error';

// Convert camelCase to snake_case
export async function convertToSnakeCase(obj: Record<string, unknown>): Promise<Record<string, unknown>> {
  const fieldMappings: Record<string, string> = {
    isFeatured: 'is_featured',
    numReviews: 'num_reviews',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    inStock: 'in_stock',
    sellingMethod: 'selling_method',
    weightUnit: 'weight_unit',
    minWeight: 'min_weight',
    // Add any other field mappings here
  };

  return Object.entries(obj).reduce((acc, [key, value]) => {
    // Skip undefined values
    if (value === undefined) return acc;
    
    const snakeKey = fieldMappings[key] || key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    acc[snakeKey] = value;
    return acc;
  }, {} as Record<string, unknown>);
}

// Convert snake_case to camelCase
export async function convertToCamelCase(obj: any): Promise<any> {
  const fieldMappings: Record<string, string> = {
    is_featured: 'isFeatured',
    num_reviews: 'numReviews',
    created_at: 'createdAt',
    updated_at: 'updatedAt',
    in_stock: 'inStock',
    stock: 'inStock',
    selling_method: 'sellingMethod', 
    weight_unit: 'weightUnit',
    min_weight: 'minWeight',
    // Add any other field mappings here
  };

  if (Array.isArray(obj)) {
    return Promise.all(obj.map(item => convertToCamelCase(item)));
  }
  if (obj !== null && typeof obj === 'object') {
    const entries = await Promise.all(
      Object.entries(obj).map(async ([key, value]) => {
        // Skip undefined values
        if (value === undefined) return [key, value];
        
        // Special handling for stock field
        if (key === 'stock' && typeof value === 'number') {
          // Convert numeric stock to boolean inStock
          return ['inStock', value > 0];
        }
        
        // Ensure in_stock is always a boolean
        if (key === 'in_stock') {
          return ['inStock', value === true || value === 1 || value === '1' || value === 'true'];
        }
        
        // Ensure images is always an array
        if (key === 'images' && value !== null) {
          let imagesArray = value;
          // If images is a string, try to parse it as JSON
          if (typeof value === 'string') {
            try {
              imagesArray = JSON.parse(value);
            } catch (e) {
              console.error('Failed to parse images string as JSON:', value);
              imagesArray = [];
            }
          }
          // If not an array, convert to array or use empty array
          if (!Array.isArray(imagesArray)) {
            imagesArray = imagesArray ? [imagesArray] : [];
          }
          return ['images', imagesArray];
        }
        
        const camelKey = fieldMappings[key] || key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
        return [camelKey, await convertToCamelCase(value)];
      })
    );
    return Object.fromEntries(entries.filter(([_, value]) => value !== undefined));
  }
  return obj;
}

// Handle Supabase errors
export async function handleSupabaseError(error: PostgrestError | null): Promise<never> {
  if (!error) throw new Error('Unknown error occurred');

  const appError: AppError = {
    message: error.message,
    code: error.code,
    details: error.details,
  };

  throw appError;
}

// Handle pagination
export async function handlePagination<T>(
  query: Promise<{ data: T[]; error: PostgrestError | null }>,
  page: number,
  limit: number,
  countQuery: Promise<{ count: number | null; error: PostgrestError | null }>
) {
  const [result, countResult] = await Promise.all([query, countQuery]);

  if (result.error) await handleSupabaseError(result.error);
  if (countResult.error) await handleSupabaseError(countResult.error);

  const totalItems = countResult.count || 0;
  const totalPages = Math.ceil(totalItems / limit);
  const offset = (page - 1) * limit;

  return {
    data: result.data,
    totalPages,
    currentPage: page,
    totalItems,
    offset,
  };
} 