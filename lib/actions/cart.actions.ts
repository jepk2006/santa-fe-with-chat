'use server';

import { SUPABASE_TABLES } from '../constants';
import { handleSupabaseError } from '../database.actions';
import { revalidatePath } from 'next/cache';
import { CartItem } from '@/types';
import { AppError, ErrorResponse, SuccessResponse } from '../types/error';
import { createClient } from '@/lib/supabase-server';

async function createServerSupabaseClient() {
  return createClient();
}

export async function getMyCart() {
  const supabase = await createServerSupabaseClient();
  
  // Use getUser() for improved security
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  const { data: cart, error } = await supabase
    .from(SUPABASE_TABLES.CARTS)
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error && error.code !== 'PGRST116') {
    handleSupabaseError(error);
  }

  if (!cart || !cart.items || cart.items.length === 0) {
    return null;
  }

  // Get all unique product IDs from the cart
  const productIds = [...new Set(cart.items.map((item: any) => item.product_id).filter(Boolean))];

  // Fetch all product details in a single query
  const { data: products, error: productsError } = await supabase
    .from(SUPABASE_TABLES.PRODUCTS)
    .select('*')
    .in('id', productIds);

  if (productsError) {
    handleSupabaseError(productsError);
    // Return cart with items but without full product details as a fallback
    return cart;
  }

  // Create a map for easy lookup
  const productsMap = products.reduce((map, product) => {
    map[product.id] = product;
    return map;
  }, {} as Record<string, any>);

  // Enrich cart items with the full product object
  const enrichedItems = cart.items.map((item: any) => ({
    ...item,
    product: productsMap[item.product_id],
  }));

  return {
    ...cart,
    items: enrichedItems,
    totalPrice: cart.total_price, // Ensure totalPrice is passed correctly
  };
}

export async function addItemToCart(
  productId: string, 
  quantity: number, 
  productDetails?: { 
    name: string; 
    price: number; 
    image: string;
    selling_method?: 'unit' | 'weight_custom' | 'weight_fixed';
    weight_unit?: string | null;
    weight?: number | null;
  }
) {
  const supabase = await createServerSupabaseClient();
  
  // Use getUser() for improved security
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('Not authenticated');
  }

  // First check if user already has a cart
  const { data: existingCart, error: fetchError } = await supabase
    .from(SUPABASE_TABLES.CARTS)
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') {
    handleSupabaseError(fetchError);
  }

  if (!existingCart) {
    // Create a new cart with the first item
    const newItem = {
      product_id: productId,
      name: productDetails?.name || 'Product',
      quantity: quantity,
      price: productDetails?.price || 0,
      image: productDetails?.image || '/placeholder.png',
      selling_method: productDetails?.selling_method || 'unit',
      weight_unit: productDetails?.weight_unit || null,
      weight: productDetails?.weight || null,
    };

    const { error } = await supabase
      .from(SUPABASE_TABLES.CARTS)
      .insert({
        user_id: user.id,
        items: [newItem],
        total_price: (productDetails?.selling_method === 'weight_custom' || productDetails?.selling_method === 'weight_fixed') && productDetails.weight 
          ? productDetails.price * productDetails.weight 
          : productDetails?.price ? productDetails.price * quantity : 0,
      });

    if (error) {
      handleSupabaseError(error);
    }
  } else {
    // Add item to existing cart
    const newItem = {
      product_id: productId,
      name: productDetails?.name || 'Product',
      quantity: quantity,
      price: productDetails?.price || 0,
      image: productDetails?.image || '/placeholder.png',
      selling_method: productDetails?.selling_method || 'unit',
      weight_unit: productDetails?.weight_unit || null,
      weight: productDetails?.weight || null,
    };

    const existingItem = existingCart.items.find((item: any) => item.product_id === productId);
    const updatedItems = existingItem
      ? existingCart.items.map((item: any) =>
          item.product_id === productId
            ? { 
                ...item, 
                quantity: (productDetails?.selling_method === 'weight_custom' || productDetails?.selling_method === 'weight_fixed') ? quantity : item.quantity + quantity,
                weight: (productDetails?.selling_method === 'weight_custom' || productDetails?.selling_method === 'weight_fixed') ? productDetails.weight : item.weight
              }
            : item
        )
      : [...existingCart.items, newItem];

    const total_price = updatedItems.reduce(
      (sum: number, item: any) => {
        if ((item.selling_method === 'weight_custom' || item.selling_method === 'weight_fixed') && item.weight) {
          return sum + (item.price * item.weight);
        }
        return sum + (item.price * item.quantity);
      },
      0
    );

    const { error } = await supabase
      .from(SUPABASE_TABLES.CARTS)
      .update({ 
        items: updatedItems,
        total_price
      })
      .eq('user_id', user.id);

    if (error) {
      handleSupabaseError(error);
    }
  }

  revalidatePath('/cart');
}

export async function removeItemFromCart(productId: string) {
  const supabase = await createServerSupabaseClient();
  
  // Use getUser() for improved security
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('Not authenticated');
  }

  const { data: cart, error: cartError } = await supabase
    .from(SUPABASE_TABLES.CARTS)
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (cartError) {
    handleSupabaseError(cartError);
  }

  const updatedItems = cart.items.filter((item: any) => item.product_id !== productId);
  
  // Calculate total considering weight-based products
  const total_price = updatedItems.reduce(
    (sum: number, item: any) => {
      if (item.selling_method === 'weight' && item.weight) {
        return sum + (item.price * item.weight);
      }
      return sum + (item.price * item.quantity);
    },
    0
  );

  const { error } = await supabase
    .from(SUPABASE_TABLES.CARTS)
    .update({ 
      items: updatedItems,
      total_price
    })
    .eq('user_id', user.id);

  if (error) {
    handleSupabaseError(error);
  }

  revalidatePath('/cart');
}

export async function updateCartItemQuantity(
  productId: string,
  quantity: number,
  weight?: number | null
): Promise<SuccessResponse<CartItem> | ErrorResponse> {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Use getUser() for improved security
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      throw new Error('Not authenticated');
    }

    const { data: cart, error: cartError } = await supabase
      .from(SUPABASE_TABLES.CARTS)
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (cartError) {
      handleSupabaseError(cartError);
    }

    const updatedItems = cart.items.map((item: any) => {
      if (item.product_id === productId) {
        // If weight is provided, it's a weight update for a weight-based product
        const isWeightBasedProduct = 
          item.selling_method === 'weight_custom' || 
          item.selling_method === 'weight_fixed' || 
          item.sellingMethod === 'weight_custom' ||
          item.sellingMethod === 'weight_fixed';
          
        if (weight !== undefined && isWeightBasedProduct) {
          return { ...item, weight };
        }
        // Otherwise it's a regular quantity update
        return { ...item, quantity };
      }
      return item;
    });

    // Calculate total considering weight-based products
    const total_price = updatedItems.reduce(
      (sum: number, item: any) => {
        const isWeightBased = 
          item.selling_method === 'weight_custom' || 
          item.selling_method === 'weight_fixed' || 
          item.sellingMethod === 'weight_custom' ||
          item.sellingMethod === 'weight_fixed';
        
        if (isWeightBased && item.weight) {
          return sum + (item.price * item.weight);
        }
        return sum + (item.price * item.quantity);
      },
      0
    );

    const { error } = await supabase
      .from(SUPABASE_TABLES.CARTS)
      .update({ 
        items: updatedItems,
        total_price
      })
      .eq('user_id', user.id);

    if (error) {
      handleSupabaseError(error);
    }

    return {
      success: true,
      message: weight !== undefined ? 'Weight updated successfully' : 'Quantity updated successfully',
    };
  } catch (error) {
    const appError = error as AppError;
    return {
      success: false,
      message: appError.message || 'Failed to update cart',
      error: appError,
    };
  }
}

export async function saveCart(
  items: CartItem[], 
  total: number, 
  phoneNumber?: string, 
  state?: string,
  fullName?: string
) {
  try {
    const supabase = await createServerSupabaseClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('Not authenticated');
    }

    // First check if user already has a cart
    const { data: existingCart, error: fetchError } = await supabase
      .from(SUPABASE_TABLES.CARTS)
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      handleSupabaseError(fetchError);
    }

    // Transform items to match database format
    const cartData = {
      user_id: user.id,
      items: items.map(item => ({
        product_id: item.id,
        name: item.name || 'Product',
        quantity: item.quantity || 1,
        price: item.price || 0,
        image: item.image || '/placeholder.png',
        selling_method: item.selling_method || 'unit',
        weight_unit: item.weight_unit || null,
        weight: item.weight || null
      })),
      total_price: total,
      // Remove the phone_number field as it's causing errors
    };

    // Recalculate total price to ensure it's correct, especially for weight-based products
    cartData.total_price = cartData.items.reduce(
      (sum: number, item: any) => {
        if ((item.selling_method === 'weight_custom' || item.selling_method === 'weight_fixed') && item.weight) {
          return sum + (item.price * item.weight);
        }
        return sum + (item.price * item.quantity);
      },
      0
    );

    if (existingCart) {
      // Update existing cart
      const { error } = await supabase
        .from(SUPABASE_TABLES.CARTS)
        .update(cartData)
        .eq('user_id', user.id);

      if (error) {
        handleSupabaseError(error);
      }
    } else {
      // Create new cart
      const { error } = await supabase
        .from(SUPABASE_TABLES.CARTS)
        .insert(cartData);

      if (error) {
        handleSupabaseError(error);
      }
    }

    revalidatePath('/cart');
  } catch (error) {
    throw error;
  }
}

export async function updatePedidoStatus(
  pedidoId: string,
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled'
): Promise<SuccessResponse<null> | ErrorResponse> {
  try {
    const supabase = await createServerSupabaseClient();
    // For admin actions, we might not need to scope to user_id, but ensure auth guard if this is user-facing.
    // If this is an admin-only action, directly use supabaseAdmin or ensure the current user has admin rights.

    const updateData: { status: string; paid_at?: string; is_paid?: boolean; delivered_at?: string; is_delivered?: boolean } = { status };

    if (status === 'paid') {
      updateData.is_paid = true;
      updateData.paid_at = new Date().toISOString();
    } else if (status === 'delivered') {
      updateData.is_delivered = true;
      updateData.delivered_at = new Date().toISOString();
      // If marking as delivered, it should also be marked as paid if not already.
      if (status === 'delivered') {
        updateData.is_paid = true; // Ensure it's marked as paid
        if (!updateData.paid_at) { // Only set paid_at if not already set by a 'paid' status update in the same call
            updateData.paid_at = new Date().toISOString();
        }
      }
    }

    const { error } = await supabase
      .from(SUPABASE_TABLES.CARTS) // Assuming 'pedidos' are in the 'carts' table
      .update(updateData)
      .eq('id', pedidoId);

    if (error) {
      return { success: false, message: error.message, error: error as AppError };
    }

    revalidatePath('/admin/pedidos');
    return { success: true, message: 'Pedido status updated successfully.' };
  } catch (e: any) {
    return { success: false, message: e.message || 'Failed to update pedido status.', error: e };
  }
}

export async function markPedidoAsPaid(
  pedidoId: string,
  isPaid: boolean
): Promise<SuccessResponse<null> | ErrorResponse> {
  try {
    const supabase = await createServerSupabaseClient();
    const updateData = {
      is_paid: isPaid,
      paid_at: isPaid ? new Date().toISOString() : null,
      status: isPaid ? 'paid' : 'pending' // Adjust status accordingly
    };

    const { error } = await supabase
      .from(SUPABASE_TABLES.CARTS)
      .update(updateData)
      .eq('id', pedidoId);

    if (error) {
      return { success: false, message: error.message, error: error as AppError };
    }
    revalidatePath('/admin/pedidos');
    return { success: true, message: `Pedido marked as ${isPaid ? 'paid' : 'unpaid'}.` };
  } catch (e: any) {
    return { success: false, message: e.message || 'Failed to update payment status.', error: e };
  }
}

export async function markPedidoAsDelivered(
  pedidoId: string,
  isDelivered: boolean
): Promise<SuccessResponse<null> | ErrorResponse> {
  try {
    const supabase = await createServerSupabaseClient();
    const updateData: { is_delivered: boolean; delivered_at: string | null; status: string; is_paid?: boolean; paid_at?: string } = {
      is_delivered: isDelivered,
      delivered_at: isDelivered ? new Date().toISOString() : null,
      status: isDelivered ? 'delivered' : 'shipped', // Or back to 'paid' if un-delivering from delivered
    };
    
    // If marking as delivered, ensure it's also marked as paid
    if (isDelivered) {
        updateData.is_paid = true;
        updateData.paid_at = new Date().toISOString(); // Potentially overwrite if paid earlier, or fetch first then update
    }

    const { error } = await supabase
      .from(SUPABASE_TABLES.CARTS)
      .update(updateData)
      .eq('id', pedidoId);

    if (error) {
      return { success: false, message: error.message, error: error as AppError };
    }
    revalidatePath('/admin/pedidos');
    return { success: true, message: `Pedido marked as ${isDelivered ? 'delivered' : 'not delivered'}.` };
  } catch (e: any) {
    return { success: false, message: e.message || 'Failed to update delivery status.', error: e };
  }
}

export async function getRecentCarts(limit = 5) {
  const supabase = await createServerSupabaseClient();
  
  const { data: carts, error } = await supabase
    .from(SUPABASE_TABLES.CARTS)
    .select(`
      *,
      user:users (
        name,
        email
      )
    `)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    return [];
  }

  return carts;
}
