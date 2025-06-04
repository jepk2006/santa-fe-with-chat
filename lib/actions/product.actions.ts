'use server';
import { supabaseAdmin } from '../supabase';
import { convertToPlainObject, formatError } from '../utils';
import { LATEST_PRODUCTS_LIMIT, PAGE_SIZE } from '../constants';
import { revalidatePath, revalidateTag } from 'next/cache';
import { insertProductSchema, updateProductSchema } from '../validators';
import { z } from 'zod';
import { convertToSnakeCase, convertToCamelCase, handlePagination, handleSupabaseError } from './database.actions';
import { Product } from '@/types';

// Get latest products
export async function getLatestProducts() {
  const timestamp = Date.now(); // Add cache busting
  const { data, error } = await supabaseAdmin
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(LATEST_PRODUCTS_LIMIT)
    .throwOnError();

  if (error) {
    throw error;
  }
  
  const convertedData = await convertToCamelCase(data);
  return convertedData;
}

// Get single product by it's slug
export async function getProductBySlug(slug: string) {
  const { data, error } = await supabaseAdmin
    .from('products')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) throw error;
  
  // Ensure we have valid data
  if (!data) throw new Error('Product not found');
  
  // Convert to camelCase and ensure images is an array
  const convertedData = await convertToCamelCase(data);
  convertedData.images = Array.isArray(convertedData.images) ? convertedData.images : [];
  
  return convertedData;
}

// Get single product by it's ID
export async function getProductById(productId: string) {
  const { data, error } = await supabaseAdmin
    .from('products')
    .select('*')
    .eq('id', productId)
    .single();

  if (error) throw error;
  return convertToPlainObject(data);
}

// Get all products with pagination
export async function getAllProducts({
  limit = PAGE_SIZE,
  page,
  query,
  category,
  price,
  rating,
}: {
  limit?: number;
  page: number;
  query: string;
  category?: string;
  price?: string;
  rating?: string;
}) {
  const timestamp = Date.now(); // Add cache busting
  let productsQuery = supabaseAdmin
    .from('products')
    .select('*', { count: 'exact' })
    .throwOnError();
  
  let countQuery = supabaseAdmin
    .from('products')
    .select('*', { count: 'exact', head: true })
    .throwOnError();

  // Apply search query filter
  if (query && query !== 'all') {
    // Search in product name OR category name
    const searchQuery = `name.ilike.%${query}%,description.ilike.%${query}%,category.ilike.%${query}%`;
    productsQuery = productsQuery.or(searchQuery);
    countQuery = countQuery.or(searchQuery);
  }

  // Apply category filter
  if (category && category !== 'all') {
    productsQuery = productsQuery.eq('category', category);
    countQuery = countQuery.eq('category', category);
  }

  // Apply price filter
  if (price && price !== 'all') {
    const [min, max] = price.split('-').map(Number);
    productsQuery = productsQuery.gte('price', min).lte('price', max);
    countQuery = countQuery.gte('price', min).lte('price', max);
  }

  // Apply rating filter
  if (rating && rating !== 'all') {
    productsQuery = productsQuery.gte('rating', Number(rating));
    countQuery = countQuery.gte('rating', Number(rating));
  }

  // Apply pagination
  const offset = (page - 1) * limit;
  productsQuery = productsQuery.range(offset, offset + limit - 1);

  const [productsResult, countResult] = await Promise.all([
    productsQuery,
    countQuery,
  ]);

  if (productsResult.error) throw productsResult.error;
  if (countResult.error) throw countResult.error;

  const totalItems = countResult.count || 0;
  const totalPages = Math.ceil(totalItems / limit);

  return {
    data: await convertToCamelCase(productsResult.data),
    totalPages,
    currentPage: page,
    totalItems,
  };
}

// Create a new product
export async function createProduct(product: Omit<Product, 'id' | 'created_at' | 'updated_at'>) {
  try {
    // Convert to snake_case for database
    const snakeCaseData = await convertToSnakeCase(product);
    
    // Validate the data
    const validatedData = insertProductSchema.parse(snakeCaseData);
    
    const { data, error } = await supabaseAdmin
      .from('products')
      .insert(validatedData)
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      throw new Error('No data returned from insert');
    }

    // Convert back to camelCase for frontend
    const camelCaseData = await convertToCamelCase(data);

    // Revalidate the products page
    revalidatePath('/admin/products');
    revalidatePath('/');
    revalidatePath('/products');
    revalidateTag('products');

    return {
      success: true,
      data: camelCaseData,
      message: 'Product created successfully'
    };
  } catch (error) {
    console.error('Error creating product:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create product',
      message: 'Failed to create product'
    };
  }
}

// Update a product
export async function updateProduct(product: Partial<Product> & { id: string }) {
  try {
    // Convert to snake_case for database
    const snakeCaseData = await convertToSnakeCase(product);
    
    // Validate the data
    const validatedData = updateProductSchema.parse(snakeCaseData);
    
    const { data, error } = await supabaseAdmin
      .from('products')
      .update(validatedData)
      .eq('id', product.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      throw new Error('No data returned from update');
    }

    // Convert back to camelCase for frontend
    const camelCaseData = await convertToCamelCase(data);

    // Revalidate all relevant paths and tags
    revalidatePath('/'); // Home page
    revalidatePath('/products'); // Products page
    revalidatePath('/admin/products'); // Admin products page
    revalidatePath(`/products/${product.id}`); // Individual product page
    revalidatePath(`/products/${camelCaseData.slug}`); // Product page by slug
    revalidateTag('products'); // Revalidate all product-related data

    return {
      success: true,
      data: camelCaseData,
      message: 'Product updated successfully',
      redirect: '/admin/products'
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update product',
      message: 'Failed to update product'
    };
  }
}

// Delete a product
export async function deleteProduct(id: string) {
  try {
    // First check if the product exists
    const { data: product, error: productError } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (productError) {
      if (productError.code === 'PGRST116') {
        return {
          success: false,
          message: 'Product not found',
        };
      }
      throw productError;
    }

    // Delete reviews if they exist (don't throw if no reviews found)
    const { error: reviewsError } = await supabaseAdmin
      .from('reviews')
      .delete()
      .eq('product_id', id);

    // Get all carts that might contain this product
    const { data: carts, error: cartsError } = await supabaseAdmin
      .from('carts')
      .select('*');

    if (cartsError) throw cartsError;

    // Update each cart that contains the product
    for (const cart of (carts || [])) {
      if (!cart.items || !Array.isArray(cart.items)) continue;

      const hasProduct = cart.items.some((item: any) => item.product_id === id || item.id === id);
      if (!hasProduct) continue;

      const updatedItems = cart.items.filter((item: any) => (item.product_id !== id && item.id !== id));
      const total_price = updatedItems.reduce(
        (sum: number, item: any) => {
          if (item.selling_method === 'weight' && item.weight) {
            return sum + (item.price * item.weight);
          }
          return sum + (item.price * item.quantity);
        },
        0
      );

      const { error: updateCartError } = await supabaseAdmin
        .from('carts')
        .update({ items: updatedItems, total_price })
        .eq('id', cart.id);

      if (updateCartError) {
        console.error('Error updating cart:', updateCartError);
        // Continue with other carts even if one fails
      }
    }

    // Finally, delete the product
    const { error: deleteError } = await supabaseAdmin
      .from('products')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    // Revalidate all relevant paths
    revalidatePath('/admin/products');
    revalidatePath('/');
    revalidatePath('/products');
    revalidateTag('products');

    return {
      success: true,
      message: 'Product deleted successfully',
    };
  } catch (error: any) {
    console.error('Error deleting product:', error);
    return {
      success: false,
      message: error.message || 'Failed to delete product',
      error: error
    };
  }
}

// Get all categories
export async function getAllCategories() {
  const { data, error } = await supabaseAdmin
    .from('products')
    .select('category')
    .order('category');

  if (error) throw error;

  const categories = data.reduce((acc: Record<string, number>, curr) => {
    if (!acc[curr.category]) {
      acc[curr.category] = 1;
    } else {
      acc[curr.category]++;
    }
    return acc;
  }, {});

  return Object.entries(categories).map(([category, count]) => ({
    category,
    _count: count as number,
  }));
}

// Get all brands
export async function getAllBrands() {
  const { data, error } = await supabaseAdmin
    .from('products')
    .select('brand')
    .order('brand');

  if (error) throw error;

  const brands = data.reduce((acc: Record<string, number>, curr) => {
    if (!acc[curr.brand]) {
      acc[curr.brand] = 1;
    } else {
      acc[curr.brand]++;
    }
    return acc;
  }, {});

  return Object.entries(brands).map(([brand, count]) => ({
    brand,
    _count: count as number,
  }));
}

// Get featured products
export async function getFeaturedProducts() {
  const timestamp = Date.now(); // Add cache busting
  const { data, error } = await supabaseAdmin
    .from('products')
    .select('*')
    .eq('is_featured', true)
    .order('created_at', { ascending: false })
    .limit(4)
    .throwOnError();

  if (error) throw error;
  return await convertToCamelCase(data);
}

// Get similar products (products from the same category)
export async function getSimilarProducts(categoryName: string, currentProductId: string, limit: number = 8) {
  try {
    // Use random ordering to get varied results each time
    const { data, error } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('category', categoryName)
      .neq('id', currentProductId) // Exclude the current product
      .order('id', { ascending: false }) // Using id instead of created_at for better distribution
      .limit(limit);
    
    if (error) throw error;
    
    // Convert the data to camelCase
    const convertedData = await convertToCamelCase(data);
    return convertedData;
  } catch (error) {
    console.error('Error fetching similar products:', error);
    return [];
  }
}
