'use server';
import { supabaseAdmin } from '../supabase';
import { convertToPlainObject, formatError } from '../utils';
import { LATEST_PRODUCTS_LIMIT, PAGE_SIZE } from '../constants';
import { revalidatePath, revalidateTag } from 'next/cache';
import { insertProductSchema, updateProductSchema } from '../validators';
import { z } from 'zod';
import { convertToSnakeCase, convertToCamelCase, handlePagination, handleSupabaseError } from './database.actions';
import { Product } from '@/types';
import { LOCATIONS } from '../constants/locations';

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
  try {
    if (!productId) throw new Error('Product ID is required');

    const { data, error } = await supabaseAdmin
      .from('products')
      .select(`
        *,
        product_inventory (
          id,
          unit_weight,
          quantity,
          unit_price,
          location_id,
          is_available
        )
      `)
      .eq('id', productId)
      .single();

    if (error) {
      console.error('Error fetching product:', error);
      throw error;
    }

    if (!data) {
      throw new Error('Product not found');
    }
    
    // Convert to camelCase and ensure images is an array
    const convertedData = await convertToCamelCase(data);
    convertedData.images = Array.isArray(convertedData.images) ? convertedData.images : [];
    
    return convertedData;
  } catch (error) {
    console.error('Error in getProductById:', error);
    throw error;
  }
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

  const convertedData = await convertToCamelCase(productsResult.data);
  return { data: convertedData, totalPages, totalItems };
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
          if (item.weight) {
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
        // Continue with other carts even if one fails
      }
    }

    // Finally, delete the product
    const { error: deleteError } = await supabaseAdmin
      .from('products')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    // Revalidate all relevant paths and tags
    revalidatePath('/'); // Home page
    revalidatePath('/products'); // Products page
    revalidatePath('/admin/products'); // Admin products page
    revalidateTag('products'); // Revalidate all product-related data

    return {
      success: true,
      message: 'Product deleted successfully',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete product',
      message: 'Failed to delete product',
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
    return [];
  }
}

// Location management
export async function createLocation(data: {
  name: string;
  address?: string;
}) {
  try {
    const { data: location, error } = await supabaseAdmin
      .from('locations')
      .insert({
        name: data.name,
        address: data.address,
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data: location };
  } catch (error) {
    console.error('Error creating location:', error);
    return { success: false, error };
  }
}

export async function getLocations() {
  try {
    const { data: locations, error } = await supabaseAdmin
      .from('locations')
      .select('*')
      .order('name');

    if (error) throw error;
    return locations;
  } catch (error) {
    console.error('Error fetching locations:', error);
    return [];
  }
}

// Product inventory management
export async function addProductInventory(data: {
  product_id: string;
  location_id: string;
  unit_weight: number;
  quantity: number;
  unit_price?: number;
}) {
  try {
    // Ensure location_id is a valid UUID. If not, try to resolve it via locations table.
    let resolvedLocationId = data.location_id;
    const isUUID = (value: string) => /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(value);

    if (!isUUID(resolvedLocationId)) {
      // Attempt to map slug to location name then fetch the corresponding UUID
      const locationMeta = LOCATIONS.find((loc) => loc.id === resolvedLocationId);
      if (!locationMeta) {
        throw new Error(`Unknown location identifier: ${resolvedLocationId}`);
      }

      const { data: locationRow, error: locationError } = await supabaseAdmin
        .from('locations')
        .select('id')
        .eq('name', locationMeta.name)
        .single();

      if (locationError) throw locationError;
      if (!locationRow) throw new Error(`Location not found for slug ${resolvedLocationId}`);
      resolvedLocationId = locationRow.id;
    }

    // Helper that performs the upsert with a given payload
    const performUpsert = async (payload: Record<string, any>) => {
      return supabaseAdmin
        .from('product_inventory')
        .upsert(payload, {
          onConflict: 'product_id,location_id,unit_weight',
          ignoreDuplicates: false,
        })
        .select()
        .single();
    };

    // First attempt with weight_unit in case the column still exists
    let { data: inventory, error } = await performUpsert({
      product_id: data.product_id,
      location_id: resolvedLocationId,
      unit_weight: data.unit_weight,
      quantity: data.quantity,
      unit_price: data.unit_price,
      weight_unit: 'kg',
    });

    // If column weight_unit does not exist (error code 42703), retry without it
    if (error && error.code === '42703') {
      ({ data: inventory, error } = await performUpsert({
        product_id: data.product_id,
        location_id: resolvedLocationId,
        unit_weight: data.unit_weight,
        quantity: data.quantity,
        unit_price: data.unit_price,
      }));
    }

    if (error) throw error;
    return { success: true, data: inventory };
  } catch (error) {
    console.error('Error adding product inventory:', error);
    return { success: false, error };
  }
}

export async function updateProductInventory(
  id: string,
  data: {
    quantity?: number;
    unit_price?: number;
    is_available?: boolean;
  }
) {
  try {
    const { data: inventory, error } = await supabaseAdmin
      .from('product_inventory')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data: inventory };
  } catch (error) {
    console.error('Error updating product inventory:', error);
    return { success: false, error };
  }
}

export async function getProductInventory(productId: string) {
  try {
    const { data: inventory, error } = await supabaseAdmin
      .from('product_inventory')
      .select(`
        *,
        locations (
          name,
          address
        )
      `)
      .eq('product_id', productId)
      // Fetch all units regardless of availability
      .order('unit_weight');

    if (error) throw error;
    return inventory;
  } catch (error) {
    console.error('Error fetching product inventory:', error);
    return [];
  }
}
