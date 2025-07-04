import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { SUPABASE_TABLES } from '@/lib/constants';

// Regex for checking if a string is a valid UUID
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orderId, phoneNumber } = body;

    // Validate request
    if (!orderId) {
      return NextResponse.json(
        { message: 'Order ID is required' },
        { status: 400 }
      );
    }

    if (!phoneNumber) {
      return NextResponse.json(
        { message: 'Phone number is required' },
        { status: 400 }
      );
    }

    // Format the phone number (remove dashes, spaces, etc.)
    const formattedPhone = phoneNumber.replace(/\D/g, '');
    
    // Create alternative phone formats for flexibility
    const phoneVariants = [
      formattedPhone,                  // 71234567
      `+591${formattedPhone}`,         // +59171234567
      formattedPhone.substring(0, 1) + " " + formattedPhone.substring(1),  // 7 1234567
      `(${formattedPhone.substring(0,1)}) ${formattedPhone.substring(1)}`,  // (7) 1234567
    ];

    try {
      // Check if we're dealing with a UUID or simplified ID
      const orderIdTrimmed = String(orderId).trim();
      let matchedOrderId = null;
      
      // If it's a UUID, try direct matching first
      if (UUID_REGEX.test(orderIdTrimmed)) {
        const result = await supabaseAdmin
          .from(SUPABASE_TABLES.ORDERS)
          .select('id')
          .eq('id', orderIdTrimmed)
          .single();
        
        if (result.data) {
          matchedOrderId = result.data.id;
        }
      } 
      
      // If not found by UUID, try the various search methods
      if (!matchedOrderId) {
        // Get all orders for this phone number
        const { data: allOrders, error: allOrdersError } = await supabaseAdmin
          .from(SUPABASE_TABLES.ORDERS)
          .select('id, simplified_id, phone_number')
          .order('created_at', { ascending: false })
          .limit(100);
        
        if (allOrdersError) {
          return NextResponse.json(
            { message: 'Error al buscar pedidos: ' + allOrdersError.message },
            { status: 500 }
          );
        }
        
        if (!allOrders || allOrders.length === 0) {
          return NextResponse.json(
            { message: 'No se encontró ningún pedido' },
            { status: 404 }
          );
        }
        
        // Function to check if phone numbers match (allowing for formatting differences)
        const phoneMatches = (dbPhone: string | null, inputPhone: string | null): boolean => {
          if (!dbPhone || !inputPhone) return false;
          
          // Remove all non-digits from both
          const cleanDbPhone = String(dbPhone).replace(/\D/g, '');
          const cleanInputPhone = String(inputPhone).replace(/\D/g, '');
          
          // Check if one contains the other (to handle partial matches, country codes etc.)
          return cleanDbPhone.includes(cleanInputPhone) || 
                 cleanInputPhone.includes(cleanDbPhone);
        };
        
        // Try various matching methods
        let matchedOrder;
        
        // 1. Exact simplified_id match
        matchedOrder = allOrders.find(order => 
          order.simplified_id === orderIdTrimmed && 
          phoneVariants.some(p => phoneMatches(order.phone_number, p))
        );
        
        if (matchedOrder) {
          matchedOrderId = matchedOrder.id;
        } else {
          // 2. Case-insensitive simplified_id match
          matchedOrder = allOrders.find(order => 
            order.simplified_id && 
            order.simplified_id.toLowerCase() === orderIdTrimmed.toLowerCase() &&
            phoneVariants.some(p => phoneMatches(order.phone_number, p))
          );
          
          if (matchedOrder) {
            matchedOrderId = matchedOrder.id;
          } else {
            // 3. Partial simplified_id match
            matchedOrder = allOrders.find(order => 
              order.simplified_id && 
              (order.simplified_id.toLowerCase().includes(orderIdTrimmed.toLowerCase()) ||
               orderIdTrimmed.toLowerCase().includes(order.simplified_id.toLowerCase())) &&
              phoneVariants.some(p => phoneMatches(order.phone_number, p))
            );
            
            if (matchedOrder) {
              matchedOrderId = matchedOrder.id;
            } else {
              // 4. UUID match
              matchedOrder = allOrders.find(order => 
                order.id.toLowerCase().includes(orderIdTrimmed.toLowerCase()) &&
                phoneVariants.some(p => phoneMatches(order.phone_number, p))
              );
              
              if (matchedOrder) {
                matchedOrderId = matchedOrder.id;
              }
            }
          }
        }
      }

      // If no order found with any matching method
      if (!matchedOrderId) {
        return NextResponse.json(
          { message: 'No autorizado: El pedido no existe o el número telefónico no coincide' },
          { status: 403 }
        );
      }

      // Now fetch the full order details with order items
      const { data: order, error: detailsError } = await supabaseAdmin
        .from(SUPABASE_TABLES.ORDERS)
        .select('*')
        .eq('id', matchedOrderId)
        .single();

      if (detailsError) {
        return NextResponse.json(
          { message: 'Error al obtener detalles del pedido' },
          { status: 500 }
        );
      }

      // Get order items
      const { data: orderItems, error: itemsError } = await supabaseAdmin
        .from('order_items')
        .select('*')
        .eq('order_id', matchedOrderId);

      if (itemsError) {
        return NextResponse.json(
          { message: 'Error al obtener los artículos del pedido' },
          { status: 500 }
        );
      }

      // Combine order with its items
      const fullOrder = {
        ...order,
        order_items: orderItems || []
      };

      // Return the full order details
      return NextResponse.json({
        order: fullOrder
      });
    } catch (dbError) {
      return NextResponse.json(
        { message: 'Error de la base de datos al obtener los detalles del pedido' },
        { status: 500 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { message: 'Error del servidor al procesar la solicitud' },
      { status: 500 }
    );
  }
}