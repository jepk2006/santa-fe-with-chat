import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase';
import { SUPABASE_TABLES } from '@/lib/constants';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EditOrderForm } from '@/components/admin/edit-order-form';
import { requireAdmin } from '@/lib/auth-guard';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Edit Order | Admin Dashboard',
};

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  selling_method?: 'unit' | 'weight';
  weight?: number;
  weight_unit?: string;
}

interface OrderDetails {
  id: string;
  user_id?: string | null;
  total_price: number;
  created_at: string;
  is_paid?: boolean;
  paid_at?: string | null;
  is_delivered?: boolean;
  delivered_at?: string | null;
  status?: string | null;
  phone_number?: string | null;
  user?: {
    name: string;
    email: string;
  }[];
  order_items: OrderItem[];
}

async function getOrderDetails(id: string): Promise<OrderDetails | null> {
  try {

    
    // Fetch order from the orders table
    const { data: orderData, error } = await supabaseAdmin
      .from(SUPABASE_TABLES.ORDERS)
      .select(`
        *,
        user:users (
          name,
          email
        ),
        order_items:order_items (*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      return null;
    }

    if (!orderData) {
      return null;
    }

    
    
    // Format order data to match expected interface
    return {
      ...orderData,
      order_items: orderData.order_items || [],
    };
  } catch (error) {
    return null;
  }
}

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditOrderPage({ params }: PageProps) {
  try {
    // Ensure user is admin
    await requireAdmin();
    
    // Access id after awaiting params to satisfy NextJS 15 requirements
    const resolvedParams = await params;
    const id = resolvedParams.id;
    
    if (!id) {
  
      return notFound();
    }
    

    const orderDetails = await getOrderDetails(id);
    
    if (!orderDetails) {

      return notFound();
    }

    return (
      <div className='space-y-6'>
        <div className='flex items-center justify-between'>
          <h1 className='text-2xl font-semibold tracking-tight'>
            Edit Order #{id.substring(0, 8)}
          </h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Order Details</CardTitle>
          </CardHeader>
          <CardContent>
            <EditOrderForm orderDetails={{
              ...orderDetails,
              items: orderDetails.order_items.map(item => ({
                ...item,
                product_id: item.id // Adding the required product_id field
              }))
            }} />
          </CardContent>
        </Card>
      </div>
    );
  } catch (error) {
    return (
      <div className='space-y-6'>
        <div className='flex items-center justify-between'>
          <h1 className='text-2xl font-semibold tracking-tight'>Error Loading Order</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive">
              Failed to load order details. Please try again or contact support.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Error: {error instanceof Error ? error.message : 'Unknown error'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }
} 