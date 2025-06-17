'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Clock, CheckCircle, XCircle, TruckIcon, PackagePlus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatPrice, formatDateTime } from '@/lib/utils';

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
  status: string;
  is_paid: boolean;
  is_delivered: boolean;
  total_price: number;
  created_at: string;
  paid_at: string | null;
  delivered_at: string | null;
  shipping_address: {
    fullName: string;
    city: string;
    phoneNumber: string;
  };
  order_items: OrderItem[];
}

const statusIcons = {
  pending: Clock,
  paid: CheckCircle,
  shipped: TruckIcon,
  delivered: PackagePlus,
  cancelled: XCircle,
};

const statusColors = {
  pending: 'bg-blue-100 text-blue-dark',
  paid: 'bg-blue-200 text-blue-dark',
  shipped: 'bg-blue-300 text-brand-white',
  delivered: 'bg-blue-400 text-brand-white',
  cancelled: 'bg-red-100 text-red-dark',
};

interface OrderDetailsClientProps {
  params: {
    id: string;
  };
  searchParams: {
    [key: string]: string | string[] | undefined;
  };
}

export function OrderDetailsClient({ params, searchParams }: OrderDetailsClientProps) {
  const router = useRouter();
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const phoneNumber = searchParams.phone as string | undefined;
  const orderId = params.id;

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!phoneNumber) {
        router.push('/order');
        return;
      }

      try {
        setIsLoading(true);
        
        const response = await fetch('/api/orders/get-order-details', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            orderId,
            phoneNumber,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Error fetching order details');
        }

        const data = await response.json();
        setOrder(data.order);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar los detalles del pedido');
        
        setTimeout(() => {
          router.push('/order');
        }, 3000);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId, phoneNumber, router]);

  if (isLoading) {
    return (
      <div className="container py-10 flex flex-col items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Cargando detalles del pedido...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-10">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
            <CardDescription>No se pudo cargar la información del pedido</CardDescription>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
            <p className="mt-4 text-sm text-muted-foreground">Redirigiendo a la página de seguimiento...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container py-10">
        <Card>
          <CardHeader>
            <CardTitle>Pedido no encontrado</CardTitle>
            <CardDescription>No se pudo encontrar el pedido con el ID proporcionado</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Verifique el ID del pedido e inténtelo de nuevo.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const StatusIcon = order.status && statusIcons[order.status as keyof typeof statusIcons] 
    ? statusIcons[order.status as keyof typeof statusIcons] 
    : Clock;

  const statusColor = order.status && statusColors[order.status as keyof typeof statusColors]
    ? statusColors[order.status as keyof typeof statusColors]
    : 'bg-gray-100 text-gray-800';

  return (
    <div className="container py-10">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Información del Pedido</CardTitle>
              <Badge className={statusColor}>
                <StatusIcon className="h-3.5 w-3.5 mr-1" />
                {order.status?.charAt(0).toUpperCase() + order.status?.slice(1)}
              </Badge>
            </div>
            <CardDescription>Pedido #{orderId.substring(0, 8)}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Fecha del Pedido</h3>
              <p>{formatDateTime(new Date(order.created_at)).dateOnly}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Información de Contacto</h3>
              <p>{order.shipping_address.fullName}</p>
              <p>{phoneNumber}</p>
              <p>{order.shipping_address.city}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Estado de Pago</h3>
                <Badge variant={order.is_paid ? "success" : "outline"}>
                  {order.is_paid ? 'Pagado' : 'Pendiente'}
                </Badge>
                {order.paid_at && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDateTime(new Date(order.paid_at)).dateOnly}
                  </p>
                )}
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Estado de Entrega</h3>
                <Badge variant={order.is_delivered ? "success" : "outline"}>
                  {order.is_delivered ? 'Entregado' : 'En Proceso'}
                </Badge>
                {order.delivered_at && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDateTime(new Date(order.delivered_at)).dateOnly}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Detalle de Productos</CardTitle>
            <CardDescription>Productos en su pedido</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {order.order_items.map((item) => (
                <div key={item.id} className="flex justify-between border-b pb-3">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.selling_method === 'weight' && item.weight
                        ? `${item.weight} ${item.weight_unit || ''}`
                        : `Cantidad: ${item.quantity}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p>{formatPrice(item.price)}</p>
                    {item.selling_method === 'weight' && item.weight ? (
                      <p className="text-sm text-muted-foreground">
                        Total: {formatPrice(item.price * item.weight)}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Total: {formatPrice(item.price * item.quantity)}
                      </p>
                    )}
                  </div>
                </div>
              ))}

              <div className="flex justify-between pt-4 font-medium">
                <span>Total del Pedido</span>
                <span>{formatPrice(order.total_price)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 