'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatId, formatPrice, formatDateTime } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { PedidoActions } from '@/components/admin/pedido-actions';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { Loader2, CalendarIcon, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export const dynamic = 'force-dynamic';

interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  name?: string;
  price?: number;
  image?: string;
  selling_method?: 'unit' | 'weight';
  weight?: number | null;
  weight_unit?: string | null;
}

interface Order {
  id: string;
  user_id: string | null;
  phone_number: string | null;
  total_price: number;
  created_at: string;
  updated_at: string;
  shipping_address?: {
    fullName: string;
    city: string;
    phoneNumber: string;
  };
  user?: {
    name: string;
    email: string;
  }[];
  is_paid?: boolean;
  paid_at?: string | null;
  is_delivered?: boolean;
  delivered_at?: string | null;
  status?: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled' | null;
  order_items: OrderItem[];
}

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<string>('');
  const { toast } = useToast();
  const router = useRouter();
  
  useEffect(() => {
    async function fetchPedidos() {
      try {
    
        setLoading(true);
        
        const response = await fetch('/api/admin/orders');
        
        if (!response.ok) {
          throw new Error('Failed to fetch orders');
        }
        
        const result = await response.json();
        
        if (result.data) {
  
          setPedidos(result.data);
        } else {
          setPedidos([]);
        }
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'No se pudieron cargar los pedidos. Por favor, intenta nuevamente.',
        });
        setPedidos([]);
      } finally {
        setLoading(false);
      }
    }
    
    fetchPedidos();
  }, [toast]);
  
  // Handle navigation to edit page
  const handleRowClick = (orderId: string, event: React.MouseEvent) => {
    // Don't navigate if clicking on the actions cell (contains dropdown)
    if ((event.target as HTMLElement).closest('[data-actions-cell="true"]')) {
      return;
    }
    
    router.push(`/admin/pedidos/edit/${orderId}`);
  };

  // Helper to normalize strings (remove accents, lowercase)
  const normalize = (str: string) => str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  // Filter orders based on search term and date filter
  const filteredPedidos = pedidos.filter(pedido => {
    // First, apply date filter if it exists
    if (dateFilter) {
      const orderDate = new Date(pedido.created_at);
      const filterDateObj = new Date(dateFilter);
      
      // Compare year, month, and day
      if (
        orderDate.getFullYear() !== filterDateObj.getFullYear() ||
        orderDate.getMonth() !== filterDateObj.getMonth() ||
        orderDate.getDate() !== filterDateObj.getDate()
      ) {
        return false;
      }
    }
    
    // Then apply text search if it exists
    if (searchTerm.trim()) {
      const searchLower = normalize(searchTerm);
      const tokens = searchLower.split(' ').filter(Boolean);

      // Build list of searchable fields for this order
      const customerName = Array.isArray(pedido.user)
        ? (pedido.user[0]?.name || '')
        : ((pedido.user as any)?.name || '');
      const shippingName = pedido.shipping_address?.fullName || '';
      const email = Array.isArray(pedido.user)
        ? (pedido.user[0]?.email || '')
        : ((pedido.user as any)?.email || '');
      const orderIdShort = formatId(pedido.id);

      // Combine relevant text fields
      const searchableText = [
        pedido.id,
        orderIdShort,
        customerName,
        shippingName,
        email,
        pedido.phone_number || '',
        ...pedido.order_items.map(item => item.name || '')
      ]
        .map(txt => normalize(txt))
        .join(' ');

      // Check that every token appears in the combined searchable text
      const allTokensMatch = tokens.every(token => searchableText.includes(token));

      return allTokensMatch;
    }
    
    // If we have a date filter but no search term, or if we have neither, we return true
    return true;
  });

  // Helper function to get customer name from different sources
  const getCustomerName = (pedido: Order) => {
    if (pedido.shipping_address?.fullName) {
      return pedido.shipping_address.fullName;
    }
    
    if (pedido.user?.[0]?.name) {
      return pedido.user[0].name;
    }
    
    return pedido.user_id ? 'Usuario' : 'Pedido de Invitado';
  };

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl font-semibold tracking-tight'>Gestión de Pedidos</h1>
      </div>
      
      <div className="flex flex-wrap gap-4 items-center mb-4">
        <div className="flex-1 max-w-md">
          <Input
            placeholder="Buscar por ID, nombre, teléfono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border-2 border-gray-300 focus:border-blue-500"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-44 border-2 border-gray-300 focus:border-blue-500"
          />
          
          {dateFilter && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setDateFilter('')}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Quitar filtro de fecha</span>
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-40">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : filteredPedidos.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <div className='overflow-x-auto'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">ID Pedido</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead className="min-w-[200px]">Items</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Fecha Creación</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-center">Pagado</TableHead>
                    <TableHead>Fecha Pago</TableHead>
                    <TableHead className="text-center">Entregado</TableHead>
                    <TableHead>Fecha Entrega</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPedidos.map((pedido) => (
                    <TableRow 
                      key={pedido.id} 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={(e) => handleRowClick(pedido.id, e)}
                    >
                      <TableCell className="font-medium">{formatId(pedido.id)}</TableCell>
                      <TableCell>{getCustomerName(pedido)}</TableCell>
                      <TableCell>{pedido.phone_number || 'N/A'}</TableCell>
                      <TableCell>
                        {pedido.order_items.map((item) => (
                          <div key={`${pedido.id}-${item.product_id}-${item.quantity}-${item.name}`} className="text-xs mb-1">
                            <span className="font-medium">{item.name || 'Producto'}</span>
                            {item.selling_method === 'weight' && item.weight ? 
                              ` - ${item.weight} ${item.weight_unit || ''}` : 
                              ` x ${item.quantity}`}
                            {item.price && 
                              ` (@ ${formatPrice(item.price)} c/u)`}
                          </div>
                        ))}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatPrice(pedido.total_price || 0)}
                      </TableCell>
                      <TableCell>
                        {formatDateTime(new Date(pedido.created_at)).dateTime}
                      </TableCell>
                      <TableCell>
                        {pedido.status ? (
                          <Badge 
                            variant={
                              pedido.status === 'delivered' ? 'default' :
                              pedido.status === 'paid' ? 'default' :
                              pedido.status === 'shipped' ? 'secondary' :
                              pedido.status === 'cancelled' ? 'destructive' : 'outline'
                            }
                            className={`capitalize text-xs px-2 py-0.5 ${
                              pedido.status === 'delivered' ? 'bg-green-500 hover:bg-green-600 text-white' :
                              pedido.status === 'paid' ? 'bg-blue-300 hover:bg-blue-400 text-brand-white' :
                              pedido.status === 'shipped' ? 'bg-blue-200 hover:bg-blue-300 text-blue-dark' :
                              pedido.status === 'pending' ? 'bg-gray-200 hover:bg-gray-300 text-gray-700' :
                              pedido.status === 'cancelled' ? 'bg-brand-red hover:bg-red-300 text-brand-white' : ''
                            }`}
                          >
                            {pedido.status}
                          </Badge>
                        ) : <Badge variant="outline" className="text-xs px-2 py-0.5">N/A</Badge>}
                      </TableCell>
                      <TableCell className="text-center">
                        {pedido.is_paid ? (
                          <Badge className="bg-green-100 text-green-700 text-xs px-2 py-0.5">Sí</Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-dark text-xs px-2 py-0.5">No</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {pedido.paid_at ? formatDateTime(new Date(pedido.paid_at)).dateOnly : '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        {pedido.is_delivered ? (
                          <Badge className="bg-green-100 text-green-700 text-xs px-2 py-0.5">Sí</Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-dark text-xs px-2 py-0.5">No</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {pedido.delivered_at ? formatDateTime(new Date(pedido.delivered_at)).dateOnly : '-'}
                      </TableCell>
                      <TableCell className="text-right" data-actions-cell="true">
                        <PedidoActions pedido={pedido} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>No Hay Pedidos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-muted-foreground'>
              {searchTerm || dateFilter ? 'No se encontraron pedidos con los criterios de búsqueda.' : 'Actualmente no hay pedidos activos en el sistema.'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
