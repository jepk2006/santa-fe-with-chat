import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { SUPABASE_TABLES } from '@/lib/constants';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orderId, isDelivered } = body;
    
    if (!orderId) {
      return NextResponse.json({
        success: false,
        message: 'Order ID is required'
      }, { status: 400 });
    }

    
    // First, fetch the current order to check status
    const { data: currentOrder, error: fetchError } = await supabaseAdmin
      .from(SUPABASE_TABLES.ORDERS)
      .select('status, is_paid')
      .eq('id', orderId)
      .single();
    
    if (fetchError) {
      return NextResponse.json({
        success: false,
        message: `Failed to fetch order: ${fetchError.message}`
      }, { status: 500 });
    }

    const currentTimestamp = new Date().toISOString();
    
    // Build update data
    let updateData: {
      is_delivered: boolean;
      delivered_at: string | null;
      status?: string;
      is_paid?: boolean;
      paid_at?: string | null;
    } = {
      is_delivered: isDelivered,
      delivered_at: isDelivered ? currentTimestamp : null,
    };

    // If marking as delivered:
    // 1. Set status to 'delivered'
    // 2. Also mark as paid if not already
    if (isDelivered) {
      updateData.status = 'delivered';
      updateData.is_paid = true;
      updateData.paid_at = updateData.paid_at || currentTimestamp;
    } else {
      // If marking as not delivered:
      // Only change status if current status is 'delivered'
      if (currentOrder.status === 'delivered') {
        // Revert to 'paid' if it's paid, otherwise to 'pending'
        updateData.status = currentOrder.is_paid ? 'paid' : 'pending';
      }
    }
    // Update with supabaseAdmin for full permissions
    const { data, error } = await supabaseAdmin
      .from(SUPABASE_TABLES.ORDERS)
      .update(updateData)
      .eq('id', orderId)
      .select();
    
    if (error) {
      return NextResponse.json({
        success: false,
        message: `Failed to update delivery status: ${error.message}`
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: `Order ${isDelivered ? 'marked as delivered' : 'marked as not delivered'} successfully`,
      data
    });
  } catch (error) {

    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Unexpected error occurred'
    }, { status: 500 });
  }
} 