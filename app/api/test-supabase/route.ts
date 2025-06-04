import { NextResponse } from 'next/server';
import { supabaseClient, supabaseAdmin } from '@/lib/supabase';
import { SUPABASE_TABLES } from '@/lib/constants';

export async function GET() {
  try {
    // Test the credentials
    const testData = {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      timestamp: new Date().toISOString()
    };
    
    // Test supabaseClient
    const clientTest = await supabaseClient
      .from(SUPABASE_TABLES.ORDERS)
      .select('id, status')
      .limit(1);
      
    // Test supabaseAdmin
    const adminTest = await supabaseAdmin
      .from(SUPABASE_TABLES.ORDERS)
      .select('id, status')
      .limit(1);
    
    return NextResponse.json({
      success: true,
      testData,
      clientTest: {
        data: clientTest.data,
        error: clientTest.error,
        status: clientTest.status
      },
      adminTest: {
        data: adminTest.data,
        error: adminTest.error,
        status: adminTest.status
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orderId, status } = body;
    
    if (!orderId) {
      return NextResponse.json({
        success: false,
        error: 'Order ID is required'
      }, { status: 400 });
    }
    
    // Create update data
    const updateData = {
      status: status || 'paid',
      is_paid: ['paid', 'shipped', 'delivered'].includes(status || 'paid'),
      is_delivered: (status || '') === 'delivered',
    };
    
    // Attempt direct Supabase client update
    const clientResult = await supabaseClient
      .from(SUPABASE_TABLES.ORDERS)
      .update(updateData)
      .eq('id', orderId)
      .select();
    
    // Also attempt with supabaseAdmin client
    const adminResult = await supabaseAdmin
      .from(SUPABASE_TABLES.ORDERS)
      .update(updateData)
      .eq('id', orderId)
      .select();
    
    return NextResponse.json({
      success: true,
      orderId,
      status,
      updateData,
      clientResult: {
        data: clientResult.data,
        error: clientResult.error,
        status: clientResult.status
      },
      adminResult: {
        data: adminResult.data,
        error: adminResult.error,
        status: adminResult.status
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 