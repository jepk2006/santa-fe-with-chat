import { createClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import { getMyOrders } from '@/lib/actions/order.actions';
import { formatCurrency, formatDateTime, formatId } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import LogoutButton from '@/components/auth/logout-button';
import OrdersTable from '@/components/account/orders-table';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export default async function AccountPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/order');
  }

  // Fetch profile using the admin client to bypass RLS for this server-side query.
  // This is safe because we are querying by the authenticated user's ID.
  const { data: profile } = await supabaseAdmin
    .from('users')
    .select('name, phone_number, shipping_address')
    .eq('id', user.id)
    .single();

  const orders = await getMyOrders();

  return (
    <div className="container py-10 space-y-8">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between pb-4">
          <CardTitle>Mi Perfil</CardTitle>
          <LogoutButton />
        </CardHeader>
        <CardContent className="space-y-2">
          <p><span className="font-medium">Nombre:</span> {profile?.name || '—'}</p>
          <p><span className="font-medium">Email:</span> {user.email}</p>
          <p><span className="font-medium">Teléfono:</span> {profile?.phone_number || '—'}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mis Pedidos</CardTitle>
        </CardHeader>
        <CardContent>
          {orders && orders.length > 0 ? (
            <OrdersTable orders={orders} />
          ) : (
            <p className="text-muted-foreground text-sm">No tienes pedidos anteriores.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 