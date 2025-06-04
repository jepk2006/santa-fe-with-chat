import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { SUPABASE_TABLES } from '@/lib/constants';

// Regex for checking if a string is a valid UUID
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  try {
    // Parse request body
    const body = await request.json().catch(() => ({}));
    
    const { orderId, phoneNumber } = body;

    // Validate request
    if (!orderId) {
      return NextResponse.json(
        { verified: false, message: 'Order ID is required' },
        { status: 400 }
      );
    }

    if (!phoneNumber) {
      return NextResponse.json(
        { verified: false, message: 'Phone number is required' },
        { status: 400 }
      );
    }
    
    // Format the phone number (remove dashes, spaces, etc.)
    const formattedPhone = phoneNumber.replace(/\D/g, '');
    
    // Create alternative phone formats for flexibility
    // Some might be stored with country code, some without
    const phoneVariants = [
      formattedPhone,                  // 71234567
      `+591${formattedPhone}`,         // +59171234567
      formattedPhone.substring(0, 1) + " " + formattedPhone.substring(1),  // 7 1234567
      `(${formattedPhone.substring(0,1)}) ${formattedPhone.substring(1)}`,  // (7) 1234567
    ];
    
    try {
      // Check order ID format
      const orderIdTrimmed = String(orderId).trim();
      
      // If it looks like a UUID, search by ID directly
      if (UUID_REGEX.test(orderIdTrimmed)) {
        // Try with each phone variant
        for (const phoneVar of phoneVariants) {
          const { data, error } = await supabaseAdmin
            .from(SUPABASE_TABLES.ORDERS)
            .select('id, status, created_at, phone_number')
            .eq('id', orderIdTrimmed)
            .limit(1)
            .maybeSingle();
          
          if (data) {
            // Order verified
            return NextResponse.json({
              verified: true,
              orderId: data.id,
              status: data.status
            });
          }
        }
      } 
      
      // Get all orders (limited batch for search)
      const { data: allOrders, error: allOrdersError } = await supabaseAdmin
        .from(SUPABASE_TABLES.ORDERS)
        .select('id, simplified_id, status, phone_number, created_at')
        .order('created_at', { ascending: false })
        .limit(100);
        
      if (allOrdersError) {
        return handleQueryError(allOrdersError);
      }

      if (!allOrders || allOrders.length === 0) {
        return NextResponse.json(
          { verified: false, message: 'No se encontró ningún pedido con esa combinación de número de pedido y teléfono' },
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
      
      // First try exact simplified_id match with phone check
      let matchedOrder = allOrders.find(order => 
        order.simplified_id === orderIdTrimmed && 
        phoneVariants.some(p => phoneMatches(order.phone_number, p))
      );
      
      if (matchedOrder) {
        return NextResponse.json({
          verified: true,
          orderId: matchedOrder.id,
          status: matchedOrder.status
        });
      }
      
      // Try case-insensitive simplified_id match
      matchedOrder = allOrders.find(order => 
        order.simplified_id && 
        order.simplified_id.toLowerCase() === orderIdTrimmed.toLowerCase() &&
        phoneVariants.some(p => phoneMatches(order.phone_number, p))
      );
      
      if (matchedOrder) {
        return NextResponse.json({
          verified: true,
          orderId: matchedOrder.id,
          status: matchedOrder.status
        });
      }
      
      // Try partial match on simplified_id
      matchedOrder = allOrders.find(order => 
        order.simplified_id && 
        (order.simplified_id.toLowerCase().includes(orderIdTrimmed.toLowerCase()) ||
         orderIdTrimmed.toLowerCase().includes(order.simplified_id.toLowerCase())) &&
        phoneVariants.some(p => phoneMatches(order.phone_number, p))
      );
      
      if (matchedOrder) {
        return NextResponse.json({
          verified: true,
          orderId: matchedOrder.id,
          status: matchedOrder.status
        });
      }
      
      // Try UUID match as last resort
      matchedOrder = allOrders.find(order => 
        order.id.toLowerCase().includes(orderIdTrimmed.toLowerCase()) &&
        phoneVariants.some(p => phoneMatches(order.phone_number, p))
      );
      
      if (matchedOrder) {
        return NextResponse.json({
          verified: true,
          orderId: matchedOrder.id,
          status: matchedOrder.status
        });
      }
      
      // No order found after all search attempts
      return NextResponse.json(
        { verified: false, message: 'No se encontró ningún pedido con esa combinación de número de pedido y teléfono' },
        { status: 404 }
      );
    } catch (dbError) {
      return NextResponse.json(
        { verified: false, message: 'Error al consultar la base de datos. Por favor intente nuevamente.' },
        { status: 500 }
      );
    }
  } catch (error) {
    // Ensure proper error response format for client
    return NextResponse.json(
      { 
        verified: false, 
        message: 'Error al procesar la solicitud. Por favor intente nuevamente.'
      },
      { status: 500 }
    );
  }
}

// Helper function to handle query errors
function handleQueryError(error: any) {
  // Check if it's a "not found" error, which is expected
  if (error.code === 'PGRST116') { // No rows returned
    return NextResponse.json(
      { verified: false, message: 'No se encontró ningún pedido con esa combinación de número de pedido y teléfono' },
      { status: 404 }
    );
  }
  
  // If it's a UUID syntax error (shouldn't happen with our approach now)
  if (error.code === '22P02') {
    return NextResponse.json(
      { verified: false, message: 'El formato del número de pedido no es válido' },
      { status: 400 }
    );
  }
  
  // Default case for other errors
  return NextResponse.json(
    { verified: false, message: 'Error en la consulta. Por favor intente nuevamente.' },
    { status: 500 }
  );
} 