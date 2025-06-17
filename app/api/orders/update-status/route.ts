import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { SUPABASE_TABLES } from '@/lib/constants';
import { requireAdmin } from '@/lib/auth-guard';

export async function POST(request: Request) {
  try {
    // Ensure the user is an admin
    await requireAdmin();
    
    const body = await request.json();
    const { orderId, status } = body;

    if (!orderId || !status) {
      return NextResponse.json(
        { error: 'Order ID and status are required' },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ['pending', 'paid', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    // Create update data with status
    let updateData: any = {
      status: status
    };
    
    // Add additional fields based on status
    if (status === 'paid') {
      updateData.is_paid = true;
      updateData.paid_at = new Date().toISOString();
    } else if (status === 'shipped') {
      // Shipped orders are implicitly paid
      updateData.is_paid = true;
      updateData.paid_at = new Date().toISOString();
    } else if (status === 'delivered') {
      updateData.is_delivered = true;
      updateData.delivered_at = new Date().toISOString();
      // If marking as delivered, ensure it's also marked as paid
      updateData.is_paid = true;
      updateData.paid_at = new Date().toISOString();
    } else if (status === 'pending') {
      // Pending orders might not be paid or delivered yet
      updateData.is_paid = false;
      updateData.paid_at = null;
      updateData.is_delivered = false;
      updateData.delivered_at = null;
    }

    const { data, error } = await supabaseAdmin
      .from(SUPABASE_TABLES.ORDERS)
      .update(updateData)
      .eq('id', orderId)
      .select();
    
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update order status' },
      { status: 500 }
    );
  }
} 