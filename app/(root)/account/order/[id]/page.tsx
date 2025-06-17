import { createClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export default async function OrderDetailPage({
  params,
}: {
  // `params` is now asynchronous
  params: Promise<{ id: string }>;
}) {
  const { id: orderId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  /* ------------------------------------------------------------------
     Fetch order header first. Doing it in two steps avoids RLS issues
     with the deep-join that was failing before. If the order exists and
     belongs to the current user we then fetch the items.               
  ------------------------------------------------------------------ */

  const {
    data: orderHeader,
    error: orderHeaderError,
  } = await supabase
    .from('orders')
    .select('id, user_id, total_price, status, created_at, shipping_address, simplified_id')
    .eq('id', orderId)
    .single();

  if (orderHeaderError || !orderHeader) {
    redirect('/account');
  }

  // Security double-check – only owner can continue.
  if (orderHeader.user_id !== user.id) {
    redirect('/account');
  }

  // STEP 2: Fetch order items using the admin client to bypass RLS issues.
  // This is safe because we've already verified ownership of the order.
  const {
    data: orderItems,
    error: orderItemsError,
  } = await supabaseAdmin
    .from('order_items')
    .select('id, name, quantity, price, selling_method, weight, weight_unit, product_id')
    .eq('order_id', orderId);

  const items = orderItems ?? [];

  // STEP 3: Fetch associated product details for images using the admin client.
  const productIds = items
    .map((item) => item.product_id)
    .filter((id): id is string => !!id);

  let productsMap: Record<string, any> = {};
  if (productIds.length > 0) {
    const { data: products } = await supabaseAdmin
      .from('products')
      .select('id, banner, images')
      .in('id', productIds);

    if (products) {
      productsMap = products.reduce((map, product) => {
        map[product.id] = product;
        return map;
      }, {} as Record<string, any>);
    }
  }

  // STEP 4: Combine all data for rendering.
  const enrichedItems = items.map((item) => ({
    ...item,
    product: item.product_id ? productsMap[item.product_id] : null,
  }));

  const order = {
    ...orderHeader,
    order_items: enrichedItems,
  };

  return (
    <div className="container py-10 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Pedido #{order.simplified_id || order.id.slice(0, 8)}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p><span className="font-medium">Fecha:</span> {formatDateTime(new Date(order.created_at)).dateTime}</p>
          <div className="flex items-center gap-2"><span className="font-medium">Estado:</span> <Badge variant="secondary" className="capitalize">{order.status}</Badge></div>
          {order.shipping_address && (
            <div className="pt-4">
              <h3 className="font-semibold mb-2">Dirección de envío</h3>
              <p>{order.shipping_address.fullName}</p>
              <p>{order.shipping_address.city}</p>
              <p>{order.shipping_address.phoneNumber}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Artículos</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead></TableHead>
                <TableHead>Producto</TableHead>
                <TableHead>Cantidad/Peso</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.order_items && order.order_items.length > 0 ? order.order_items.map((item: any) => (
                <TableRow key={item.id}>
                  <TableCell className="w-24 h-24 relative">
                    <Image
                      src={
                        item.image ??
                        item.product?.banner ??
                        (Array.isArray(item.product?.images) && item.product.images.length ? item.product.images[0] : '/images/placeholder.jpg')
                      }
                      alt={item.name}
                      fill
                      className="object-cover rounded-md"
                    />
                  </TableCell>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>
                    {item.selling_method === 'weight'
                      ? `${item.weight} ${item.weight_unit}`
                      : `${item.quantity} u.`}
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(item.price * (item.selling_method === 'weight' ? item.weight : item.quantity))}</TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Sin artículos</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <div className="text-right pt-4 font-semibold text-lg">
            Total: {formatCurrency(order.total_price)}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}