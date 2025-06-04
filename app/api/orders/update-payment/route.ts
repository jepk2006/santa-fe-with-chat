import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { SUPABASE_TABLES } from '@/lib/constants';

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

    console.log(`API: Updating payment for order ${orderId} to ${isPaid ? 'paid' : 'unpaid'}`);
    
    // First, fetch the current order to check status
    const { data: currentOrder, error: fetchError } = await supabaseAdmin
      .from(SUPABASE_TABLES.ORDERS)
      .select('status, is_delivered')
      .eq('id', orderId)
      .single();
    
    if (fetchError) {
      console.error('API: Error fetching order:', fetchError);
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
    let updateData: {
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
    
    console.log('API: Update data:', updateData);
    
    // Update with supabaseAdmin for full permissions
    const { data, error } = await supabaseAdmin
      .from(SUPABASE_TABLES.ORDERS)
      .update(updateData)
      .eq('id', orderId)
      .select();
    
    if (error) {
      console.error('API: Error updating payment status:', error);
      return NextResponse.json({
        success: false,
        message: `Failed to update payment status: ${error.message}`
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: `Order ${isPaid ? 'marked as paid' : 'marked as unpaid'} successfully`,
      data
    });
  } catch (error) {
    console.error('API: Unexpected error:', error);
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Unexpected error occurred'
    }, { status: 500 });
  }
} 