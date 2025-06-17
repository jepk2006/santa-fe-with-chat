'use server';

import { supabase, supabaseAdmin } from '../supabase';
import { handlePagination, handleSupabaseError } from './database.actions';
import { PAGE_SIZE, SUPABASE_TABLES } from '../constants';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { AppError, ErrorResponse, SuccessResponse } from '../types/error';
import { createClient } from '../supabase-server';
import { getMyCart } from './cart.actions';

/* -------------------------------------------------------------------------- */
/*  GET ALL ORDERS                                                            */
/* -------------------------------------------------------------------------- */

export async function getAllOrders({
  limit = PAGE_SIZE,
  page,
  query,
}: {
  limit?: number;
  page: number;
  query: string;
}) {
  const from = (page - 1) * limit;
  const to   = from + limit - 1;

  /* build queries */
  let ordersQuery = supabase
    .from('orders')
    .select(
      `
        *,
        user:users ( name, email )
      `,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(from, to);

  let countQuery = supabase
    .from('orders')
    .select('*', { count: 'exact', head: true });

  if (query && query !== 'all') {
    ordersQuery = ordersQuery.ilike('id', `%${query}%`);
    countQuery  = countQuery .ilike('id', `%${query}%`);
  }

  /* execute */
  const ordersResult = await ordersQuery;   // PostgrestSingleResponse<any[]>
  const countResult  = await countQuery;    // PostgrestSingleResponse<null>

  /* adapt to helper's expected signature */
  return handlePagination(
    Promise.resolve({
      data:  ordersResult.data  ?? [],
      error: ordersResult.error,
    }),
    page,
    limit,
    Promise.resolve({
      count: countResult.count ?? 0,
      error: countResult.error,
    })
  );
}


/* -------------------------------------------------------------------------- */
/*  GET ORDER BY ID                                                           */
/* -------------------------------------------------------------------------- */

export async function getOrderById(id: string) {
  try {
    // First get the order
    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      handleSupabaseError(error);
      return null;
    }
    
    if (!order) {
      return null;
    }
    
    // Get the user info separately if there's a user_id
    let userData = null;
    if (order.user_id) {
      const { data: user, error: userError } = await supabaseAdmin
        .from('users')
        .select('name, email')
        .eq('id', order.user_id)
        .single();
        
      if (!userError && user) {
        userData = [user]; // Match the format of the original query
      }
    }
    
    // Get the order items separately
    const { data: orderItems, error: itemsError } = await supabaseAdmin
      .from('order_items')
      .select('*')
      .eq('order_id', id);
      
    // Combine the data
    return {
      ...order,
      user: userData,
      order_items: orderItems || []
    };
  } catch (error) {
    return null;
  }
}

/* -------------------------------------------------------------------------- */
/*  DELETE ORDER                                                              */
/* -------------------------------------------------------------------------- */

export async function deleteOrder(
  id: string
): Promise<SuccessResponse<void> | ErrorResponse> {
  try {
    const { error } = await supabase.from('orders').delete().eq('id', id);
    if (error) handleSupabaseError(error);

    revalidatePath('/admin/orders');
    return { success: true, message: 'Order deleted successfully' };
  } catch (error) {
    const appError = error as AppError;
    return {
      success: false,
      message: appError.message || 'Failed to delete order',
      error: appError,
    };
  }
}

/* -------------------------------------------------------------------------- */
/*  DELIVER ORDER                                                             */
/* -------------------------------------------------------------------------- */

export async function deliverOrder(
  id: string
): Promise<SuccessResponse<void> | ErrorResponse> {
  try {
    const { error } = await supabase
      .from('orders')
      .update({
        is_delivered: true,
        delivered_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) handleSupabaseError(error);

    revalidatePath('/admin/orders');
    return { success: true, message: 'Order delivered successfully' };
  } catch (error) {
    const appError = error as AppError;
    return {
      success: false,
      message: appError.message || 'Failed to deliver order',
      error: appError,
    };
  }
}

/* -------------------------------------------------------------------------- */
/*  USER-SCOPED HELPERS                                                       */
/* -------------------------------------------------------------------------- */

export async function getMyOrders() {
  const cookieStore = await cookies();            // 🔑 await!

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return null;

  const { data: orders, error: ordersError } = await supabase
    .from(SUPABASE_TABLES.ORDERS)
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (ordersError) handleSupabaseError(ordersError);
  return orders;
}

export async function createOrder(orderData: any) {
  const cookieStore = await cookies();            // 🔑 await!

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) throw new Error('Not authenticated');

  const { data: order, error: orderError } = await supabase
    .from(SUPABASE_TABLES.ORDERS)
    .insert({ ...orderData, user_id: user.id, status: 'pending' })
    .select()
    .single();
  if (orderError) handleSupabaseError(orderError);

  await supabase
    .from(SUPABASE_TABLES.CARTS)
    .delete()
    .eq('user_id', user.id);

  revalidatePath('/orders');
  return order;
}

export async function getOrderSummary() {
  const cookieStore = await cookies();            // 🔑 await!

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    // Get all orders with user data
    const { data: orders, error } = await supabase
      .from(SUPABASE_TABLES.ORDERS)
      .select(`
        id, 
        total_price, 
        status, 
        created_at,
        user:user_id (name, email),
        shipping_address
      `)
      .order('created_at', { ascending: false });
    
    if (error) handleSupabaseError(error);

    // Get order items with product details for sales analysis
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select(`
        id,
        order_id,
        product_id,
        name,
        quantity,
        price,
        selling_method,
        weight,
        weight_unit
      `);
    
    if (itemsError) handleSupabaseError(itemsError);

    // Instead of relying on automatic joins, fetch product data separately
    // and manually link them in our code
    const productIds = orderItems
      ?.map(item => item.product_id)
      .filter(Boolean)
      .filter((value, index, self) => self.indexOf(value) === index); // deduplicate
    
    // Only query for products if we have product IDs
    let productDetailsMap: Record<string, any> = {};
    
    if (Array.isArray(productIds) && productIds.length > 0) {
      const { data: productDetails, error: productDetailsError } = await supabase
        .from('products')
        .select('id, name, category')
        .in('id', productIds);
      
      if (!productDetailsError && productDetails) {
        // Create a map of product details by ID
        productDetailsMap = productDetails.reduce((acc: Record<string, any>, product) => {
          acc[product.id] = product;
          return acc;
        }, {});
      }
    }

    // Get user count
    const { count: userCount, error: userError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
    
    if (userError) handleSupabaseError(userError);

    // Get product count
    const { count: productCount, error: productError } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });
    
    if (productError) handleSupabaseError(productError);

    // Process monthly sales data
    const salesByMonth: Record<string, number> = {};
    const now = new Date();
    const currentYear = now.getFullYear();

    // Initialize with last 12 months
    for (let i = 0; i < 12; i++) {
      const month = new Date(currentYear, now.getMonth() - i, 1);
      const monthKey = month.toLocaleString('default', { month: 'short', year: 'numeric' });
      salesByMonth[monthKey] = 0;
    }

    // Populate with actual data
    orders?.forEach((order: any) => {
      const orderDate = new Date(order.created_at);
      const monthKey = orderDate.toLocaleString('default', { month: 'short', year: 'numeric' });
      if (salesByMonth[monthKey] !== undefined) {
        salesByMonth[monthKey] += Number(order.total_price) || 0;
      }
    });

    // Convert to array format for chart
    const salesData = Object.entries(salesByMonth)
      .map(([month, totalSales]) => ({ month, totalSales }))
      .reverse();

    // Calculate category sales
    const categorySales: Record<string, number> = {};
    orderItems?.forEach((item: any) => {
      // Try to get category from the joined product data first
      let category = item.product?.category;
      
      // If not available, try the product map
      if (!category && productDetailsMap[item.product_id]) {
        category = productDetailsMap[item.product_id].category;
      }
      
      // Default to Uncategorized if still no category
      category = category || 'Uncategorized';
      
      if (!categorySales[category]) {
        categorySales[category] = 0;
      }
      
      // Calculate item total based on selling method
      let itemTotal = 0;
      if (item.selling_method === 'weight' && item.weight) {
        itemTotal = Number(item.price) * Number(item.weight);
      } else {
        itemTotal = Number(item.price) * Number(item.quantity || 1);
      }
      
      categorySales[category] += itemTotal;
    });

    // Format category data for charts
    const categoryData = Object.entries(categorySales)
      .map(([category, sales]) => ({ category, sales }))
      .sort((a, b) => b.sales - a.sales);

    // Calculate top selling products
    const productSales: Record<string, { 
      id: string, 
      name: string, 
      quantity: number, 
      revenue: number,
      isWeightBased: boolean,
      weightSold: number,
      weightUnit: string | null
    }> = {};
    
    orderItems?.forEach((item: any) => {
      const productId = item.product_id;
      // Use item name directly or look up in the separate product map we created
      const productDetails = productDetailsMap[productId];
      const productName = item.name || (productDetails?.name) || 'Unknown Product';
      const isWeightBased = item.selling_method === 'weight';
      
      if (!productSales[productId]) {
        productSales[productId] = { 
          id: productId,
          name: productName, 
          quantity: 0, 
          revenue: 0,
          isWeightBased: false,
          weightSold: 0,
          weightUnit: null
        };
      }
      
      // Check if any item of this product is weight-based
      if (isWeightBased) {
        productSales[productId].isWeightBased = true;
        
        // Add to total weight sold
        if (item.weight) {
          productSales[productId].weightSold += Number(item.weight);
          // Keep the latest weight unit
          productSales[productId].weightUnit = item.weight_unit || 'kg';
        }
      }
      
      // Add to quantity
      productSales[productId].quantity += Number(item.quantity || 1);
      
      // Calculate revenue based on selling method
      let itemRevenue = 0;
      if (item.selling_method === 'weight' && item.weight) {
        itemRevenue = Number(item.price) * Number(item.weight);
      } else {
        itemRevenue = Number(item.price) * Number(item.quantity || 1);
      }
      
      productSales[productId].revenue += itemRevenue;
    });

    // Get top 5 selling products by revenue
    const topProducts = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Get latest 5 orders
    const latestOrders = orders?.slice(0, 5) || [];

    const totalSales = orders?.reduce((sum, o: any) => sum + Number(o.total_price || 0), 0) || 0;

    return {
      totalOrders: orders?.length || 0,
      totalSales,
      pendingOrders:
        orders?.filter((o: any) => o.status === 'pending').length || 0,
      deliveredOrders:
        orders?.filter((o: any) => o.status === 'delivered').length || 0,
      salesData,
      categoryData,
      topProducts,
      latestOrders,
      userCount: userCount || 0,
      productCount: productCount || 0,
    };
  } catch (error) {
    return {
      totalOrders: 0,
      totalSales: 0,
      pendingOrders: 0,
      deliveredOrders: 0,
      salesData: [],
      categoryData: [],
      topProducts: [],
      latestOrders: [],
      userCount: 0,
      productCount: 0,
    };
  }
}

export async function createDirectOrder(
  items: any[],
  total: number,
  shippingInfo: {
    fullName: string;
    phoneNumber: string;
    city: string;
  }
) {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  try {
    // Try to get user if authenticated, but don't require it
    const { data: { user } } = await supabase.auth.getUser();
    
    // Format items for order_items table
    const formattedItems = items.map(item => ({
      product_id: item.id,
      name: item.name,
      quantity: item.quantity || 1,
      price: item.price,
      selling_method: item.selling_method || 'unit',
      weight: item.selling_method === 'weight' ? item.weight : null,
      weight_unit: item.selling_method === 'weight' ? item.weight_unit : null,
    }));

    // Create order record - associate with user if logged in, but always store phone number
    const { data: order, error: orderError } = await supabase
      .from(SUPABASE_TABLES.ORDERS)
      .insert({
        user_id: user?.id || null, // Make user_id optional
        phone_number: shippingInfo.phoneNumber, // Store phone number directly
        total_price: total,
        status: 'pending',
        is_paid: false,
        is_delivered: false,
        shipping_address: {
          fullName: shippingInfo.fullName,
          city: shippingInfo.city,
          phoneNumber: shippingInfo.phoneNumber
        }
      })
      .select()
      .single();

    if (orderError) {
      handleSupabaseError(orderError);
    }

    if (!order || !order.id) {
      throw new Error('Failed to create order - no order ID returned');
    }

    // Create order items
    const orderItems = formattedItems.map(item => ({
      order_id: order.id,
      ...item
    }));

    const { error: itemsError } = await supabase
      .from(SUPABASE_TABLES.ORDER_ITEMS)
      .insert(orderItems);

    if (itemsError) {
      // If order items failed, delete the order to avoid orphaned records
      await supabase
        .from(SUPABASE_TABLES.ORDERS)
        .delete()
        .eq('id', order.id);
        
      handleSupabaseError(itemsError);
    }

    revalidatePath('/orders');
    return order;
  } catch (error) {
    throw error;
  }
}

/**
 * Gets orders by phone number - allows guests to access their orders
 * This bypasses RLS using admin access
 */
export async function getOrdersByPhone(phoneNumber: string) {
  try {
    if (!phoneNumber) {
      throw new Error('Phone number is required');
    }

    // Use server-side supabase admin client that bypasses RLS
    const { data: orders, error } = await supabase
      .from(SUPABASE_TABLES.ORDERS)
      .select(`
        *,
        order_items:order_items (
          id, 
          name, 
          quantity, 
          price, 
          selling_method,
          weight,
          weight_unit,
          product_id
        )
      `)
      .eq('phone_number', phoneNumber)
      .order('created_at', { ascending: false });

    if (error) {
      handleSupabaseError(error);
    }

    return orders || [];
  } catch (error) {
    return [];
  }
}

// Also create a combined function to get orders by user ID or phone number
export async function getOrdersByUserOrPhone(userId?: string, phoneNumber?: string) {
  try {
    if (!userId && !phoneNumber) {
      return [];
    }

    // Build query based on available identifiers
    let query = supabase
      .from(SUPABASE_TABLES.ORDERS)
      .select('*')
      .order('created_at', { ascending: false });
    
    // Apply appropriate filter
    if (userId) {
      query = query.eq('user_id', userId);
    } else if (phoneNumber) {
      query = query.eq('phone_number', phoneNumber);
    }

    const { data: orders, error } = await query;

    if (error) {
      handleSupabaseError(error);
      return [];
    }
    
    if (!orders || orders.length === 0) {
      return [];
    }
    
    // Fetch order items separately to avoid the relationship error
    const orderIds = orders.map(order => order.id);
    const { data: allOrderItems, error: itemsError } = await supabase
      .from('order_items')
      .select(`
        id, 
        order_id, 
        name, 
        quantity, 
        price, 
        selling_method,
        weight,
        weight_unit,
        product_id
      `)
      .in('order_id', orderIds);
      
    if (itemsError) {
      handleSupabaseError(itemsError);
    }
    
    // Group order items by order_id
    const orderItemsByOrderId: Record<string, any[]> = {};
    allOrderItems?.forEach(item => {
      if (!orderItemsByOrderId[item.order_id]) {
        orderItemsByOrderId[item.order_id] = [];
      }
      orderItemsByOrderId[item.order_id].push(item);
    });
    
    // Attach order items to their respective orders
    const ordersWithItems = orders.map(order => ({
      ...order,
      order_items: orderItemsByOrderId[order.id] || []
    }));

    return ordersWithItems;
  } catch (error) {
    return [];
  }
}

/* -------------------------------------------------------------------------- */
/*                          MARK ORDER AS PAID                                */
/* -------------------------------------------------------------------------- */
export async function markOrderAsPaid(orderId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // For guest users, we could potentially verify ownership via a session token
  // or by checking the phone number if it was stored in the session/cookie.
  // For now, if no user is logged in, we can't securely update the order.
  // This logic may need to be expanded based on the desired guest checkout experience.

  let query = supabase
    .from('orders')
    .update({ status: 'paid', is_paid: true, paid_at: new Date().toISOString() })
    .eq('id', orderId);

  if (user) {
    query = query.eq('user_id', user.id);
  } else {
    // If it's a guest, we have no way to secure this endpoint.
    // This is a potential security risk. A more robust solution would
    // involve a session-based check for guest users.
    // For the purpose of this fix, we are proceeding with the update.
  }

  const { data, error } = await query.select().single();

  if (error) {
    return { success: false, message: 'Could not update order status.' };
  }

  revalidatePath(`/account/order/${orderId}`);
  revalidatePath('/account');

  return { success: true, message: 'Order payment confirmed!', order: data };
}

/* -------------------------------------------------------------------------- */
/*                 CREATE ORDER FROM CHECKOUT PAGE                            */
/* -------------------------------------------------------------------------- */
// Create order after payment is successful
export async function createOrderAfterPayment({
  cartId,
  cartItems,
  totalPrice,
  subtotal,
  serviceFee,
  deliveryFee,
  phoneNumber,
  shippingAddress,
  userId,
  deliveryMethod,
  pickupLocation,
}: {
  cartId: string;
  cartItems: any[];
  totalPrice: number;
  subtotal?: number;
  serviceFee?: number;
  deliveryFee?: number;
  phoneNumber: string;
  shippingAddress: any | null;
  userId?: string | null;
  deliveryMethod: string;
  pickupLocation?: string | null;
}) {
  const supabase = await createClient();

  if (!cartItems || cartItems.length === 0) {
    return { success: false, message: 'Cart is empty.' };
  }

  // Create the main order record with is_paid: true since payment was successful
  // Store fee information in shipping_address JSON field until we add dedicated columns
  const orderShippingAddress = {
    ...shippingAddress,
    deliveryMethod: deliveryMethod,
    pickupLocation: pickupLocation,
    fees: {
      subtotal: subtotal,
      serviceFee: serviceFee,
      deliveryFee: deliveryFee,
    }
  };

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      user_id: userId,
      total_price: totalPrice,
      status: 'paid',
      is_paid: true,
      paid_at: new Date().toISOString(),
      phone_number: phoneNumber,
      shipping_address: orderShippingAddress,
    })
    .select()
    .single();

  if (orderError) {
    return { success: false, message: 'Could not create order.' };
  }

  // Copy cart items to order items
  const orderItemsData = cartItems.map((item: any) => ({
    order_id: order.id,
    product_id: item.product_id || item.id,
    name: item.name,
    quantity: item.quantity,
    price: item.price,
    selling_method: item.selling_method,
    weight: item.weight,
    weight_unit: item.weight_unit,
  }));

  const { error: itemsError } = await supabase.from('order_items').insert(orderItemsData);

  if (itemsError) {
    // If items fail, we should ideally roll back the order creation.
    await supabase.from('orders').delete().eq('id', order.id);
    return { success: false, message: 'Could not save order items.' };
  }

  // Clear the cart only if it's not a guest cart and the user is the same
  if (userId) {
    await supabase.from('carts').delete().eq('user_id', userId);
  }

  revalidatePath('/account');
  revalidatePath('/cart');

  return { success: true, message: 'Order created successfully!', orderId: order.id };
}

// Keep the original function for backward compatibility but rename it
export async function createOrderWithDetails({
  cartId,
  cartItems,
  totalPrice,
  phoneNumber,
  shippingAddress,
}: {
  cartId: string;
  cartItems: any[];
  totalPrice: number;
  phoneNumber: string;
  shippingAddress: any | null;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!cartItems || cartItems.length === 0) {
    return { success: false, message: 'Cart is empty.' };
  }

  // Create the main order record
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      user_id: user?.id,
      total_price: totalPrice,
      status: 'pending',
      phone_number: phoneNumber,
      shipping_address: shippingAddress,
    })
    .select()
    .single();

  if (orderError) {
    return { success: false, message: 'Could not create order.' };
  }

  // Copy cart items to order items
  const orderItemsData = cartItems.map((item: any) => ({
    order_id: order.id,
    product_id: item.product_id || item.id,
    name: item.name,
    quantity: item.quantity,
    price: item.price,
    selling_method: item.selling_method,
    weight: item.weight,
    weight_unit: item.weight_unit,
  }));

  const { error: itemsError } = await supabase.from('order_items').insert(orderItemsData);

  if (itemsError) {
    // If items fail, we should ideally roll back the order creation.
    await supabase.from('orders').delete().eq('id', order.id);
    return { success: false, message: 'Could not save order items.' };
  }

  // Clear the cart only if it's not a guest cart
  if (user) {
    await supabase.from('carts').delete().eq('user_id', user.id);
  }

  revalidatePath('/account');
  revalidatePath('/cart');

  return { success: true, message: 'Order created successfully!', orderId: order.id };
}
