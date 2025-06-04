import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { SUPABASE_TABLES } from '@/lib/constants';
import { requireAdmin } from '@/lib/auth-guard';

export async function GET() {
  try {
    // Ensure the user is an admin
    await requireAdmin();
    
    console.log('Fetching orders from database via API');
    const { data, error } = await supabaseAdmin
      .from(SUPABASE_TABLES.ORDERS)
      .select(`
        *,
        user:users (
          name,
          email
        ),
        order_items:order_items (*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching pedidos:', error);
      return NextResponse.json(
        { error: 'Failed to fetch orders' },
        { status: 500 }
      );
    }
    
    console.log(`Found ${data?.length || 0} orders`);
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error in orders API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
} 