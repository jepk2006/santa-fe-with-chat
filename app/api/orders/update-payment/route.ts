import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { SUPABASE_TABLES } from '@/lib/constants';

// Function to remove inventory units for weight_fixed products
async function removeInventoryUnits(orderId: string) {
  try {
    // Get order items with weight_fixed selling method and inventory_id
    const { data: orderItems, error: fetchError } = await supabaseAdmin
      .from('order_items')
      .select('inventory_id, selling_method, name')
      .eq('order_id', orderId)
      .eq('selling_method', 'weight_fixed')
      .not('inventory_id', 'is', null);

    if (fetchError) {
      console.error('Error fetching order items:', fetchError);
      return { success: false, message: 'Failed to fetch order items' };
    }

    if (!orderItems || orderItems.length === 0) {
      // No weight_fixed items with inventory_id, nothing to remove
      return { success: true, message: 'No inventory units to remove' };
    }

    // Remove the specific inventory units
    const inventoryIds = orderItems.map(item => item.inventory_id);
    const { error: deleteError } = await supabaseAdmin
      .from('product_inventory')
      .delete()
      .in('id', inventoryIds);

    if (deleteError) {
      console.error('Error removing inventory units:', deleteError);
      return { success: false, message: 'Failed to remove inventory units' };
    }

    console.log(`Removed ${inventoryIds.length} inventory units for order ${orderId}:`, 
                orderItems.map(item => item.name));

    return { success: true, message: `Removed ${inventoryIds.length} inventory units` };
  } catch (error) {
    console.error('Error in removeInventoryUnits:', error);
    return { success: false, message: 'Unexpected error removing inventory' };
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orderId, isPaid } = body;
    
    if (!orderId) {
      return NextResponse.json({
        success: false,
        message: 'Order ID is required'
      }, { status: 400 });
    }

    
    // First, fetch the current order to check status
    const { data: currentOrder, error: fetchError } = await supabaseAdmin
      .from(SUPABASE_TABLES.ORDERS)
      .select('status, is_delivered')
      .eq('id', orderId)
      .single();
    
    if (fetchError) {
      return NextResponse.json({
        success: false,
        message: `Failed to fetch order: ${fetchError.message}`
      }, { status: 500 });
    }

    // Don't allow marking as unpaid if already delivered
    if (!isPaid && currentOrder.is_delivered) {
      return NextResponse.json({
        success: false,
        message: 'Cannot mark a delivered order as unpaid'
      }, { status: 400 });
    }

    const currentTimestamp = new Date().toISOString();
    
    // Build update data
    const updateData: {
      is_paid: boolean;
      paid_at: string | null;
      status?: string;
    } = {
      is_paid: isPaid,
      paid_at: isPaid ? currentTimestamp : null,
    };

    // Only update status if order is not delivered or we're marking as paid
    if (isPaid) {
      updateData.status = 'paid';
    } else if (currentOrder.status === 'paid') {
      // Only revert to pending if current status is 'paid'
      updateData.status = 'pending';
    }
    // Don't change status if unpaying a delivered/shipped order
    
    
    // Update with supabaseAdmin for full permissions
    const { data, error } = await supabaseAdmin
      .from(SUPABASE_TABLES.ORDERS)
      .update(updateData)
      .eq('id', orderId)
      .select();
    
    if (error) {
      return NextResponse.json({
        success: false,
        message: `Failed to update payment status: ${error.message}`
      }, { status: 500 });
    }
    
    // If marking as paid, remove inventory units for weight_fixed products
    if (isPaid) {
      const inventoryResult = await removeInventoryUnits(orderId);
      if (!inventoryResult.success) {
        console.error('Failed to remove inventory units:', inventoryResult.message);
        // Log the error but don't fail the payment update
        // The payment is successful, but inventory cleanup failed
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Order ${isPaid ? 'marked as paid' : 'marked as unpaid'} successfully`,
      data
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Unexpected error occurred'
    }, { status: 500 });
  }
} 