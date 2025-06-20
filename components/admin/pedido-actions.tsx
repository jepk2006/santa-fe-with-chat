'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MoreHorizontal,
  Loader2,
  PenSquare,
  Trash2,
  CreditCard,
  Truck,
  XCircle,
  PackageMinus,
} from 'lucide-react';
import { supabaseClient } from '@/lib/supabase';
import { SUPABASE_TABLES } from '@/lib/constants';

interface Cart {
  id: string;
  is_paid?: boolean;
  is_delivered?: boolean;
  status?: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled' | null;
  order_items?: any[];
}

interface PedidoActionsProps {
  pedido: Cart;
}

async function deleteOrder(orderId: string) {
  try {
    const { error } = await supabaseClient
      .from(SUPABASE_TABLES.ORDERS)
      .delete()
      .eq('id', orderId);
    
    if (error) {
      throw new Error(error.message || 'Failed to delete order');
    }
    
    return { success: true };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Failed to delete order' };
  }
}

async function apiUpdatePaymentStatus(orderId: string, isPaid: boolean) {
  try {    
    const response = await fetch('/api/orders/update-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        orderId,
        isPaid,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `API error: ${response.status}`);
    }
    
    const result = await response.json();
    return { success: true, data: result.data };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'API request failed' };
  }
}

async function updatePaymentStatus(orderId: string, isPaid: boolean) {
  try {
    const apiResult = await apiUpdatePaymentStatus(orderId, isPaid);
    if (apiResult.success) {
      return apiResult;
    }
    
    const currentTimestamp = new Date().toISOString();
    
    let updateData: {
      is_paid: boolean;
      paid_at: string | null;
      status?: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
    } = {
      is_paid: isPaid,
      paid_at: isPaid ? currentTimestamp : null,
      status: isPaid ? 'paid' : 'pending'
    };

    const { data: orderData, error: fetchError } = await supabaseClient
      .from(SUPABASE_TABLES.ORDERS)
      .select('status, is_delivered')
      .eq('id', orderId)
      .single();
    
    if (fetchError) {
      throw new Error(fetchError.message || 'Failed to fetch order data');
    }
    
    if (!isPaid && orderData.is_delivered) {
      throw new Error('Cannot mark a delivered order as unpaid');
    }
    
    if (!isPaid && orderData.status === 'delivered') {
      updateData = {
        is_paid: isPaid,
        paid_at: null
      };
    }

    const { data, error } = await supabaseClient
      .from(SUPABASE_TABLES.ORDERS)
      .update(updateData)
      .eq('id', orderId)
      .select();
    
    if (error) {
      throw new Error(error.message || 'Failed to update payment status');
    }
    
    if (!data || data.length === 0) {
      return { success: false, message: 'No data returned from update operation' };
    } else {
      return { success: true, data };
    }
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Failed to update payment status' };
  }
}

async function apiUpdateDeliveryStatus(orderId: string, isDelivered: boolean) {
  try {
    const response = await fetch('/api/orders/update-delivery', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        orderId,
        isDelivered,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `API error: ${response.status}`);
    }
    
    const result = await response.json();
    return { success: true, data: result.data };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'API request failed' };
  }
}

async function updateDeliveryStatus(orderId: string, isDelivered: boolean) {
  try {
    const apiResult = await apiUpdateDeliveryStatus(orderId, isDelivered);
    if (apiResult.success) {
      return apiResult;
    }
    
    const currentTimestamp = new Date().toISOString();
    
    const updateData: {
      is_delivered: boolean;
      delivered_at: string | null;
      status?: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
      is_paid?: boolean;
      paid_at?: string | null;
    } = {
      is_delivered: isDelivered,
      delivered_at: isDelivered ? currentTimestamp : null,
    };

    const { data: orderData, error: fetchError } = await supabaseClient
      .from(SUPABASE_TABLES.ORDERS)
      .select('status, is_paid')
      .eq('id', orderId)
      .single();
    
    if (fetchError) {
      throw new Error(fetchError.message || 'Failed to fetch order data');
    }

    if (isDelivered) {
      updateData.status = 'delivered';
      updateData.is_paid = true;
      updateData.paid_at = currentTimestamp;
    } else {
      if (orderData.status === 'delivered') {
        updateData.status = orderData.is_paid ? 'paid' : 'pending';
      }
    }

    const { data, error } = await supabaseClient
      .from(SUPABASE_TABLES.ORDERS)
      .update(updateData)
      .eq('id', orderId)
      .select();
    
    if (error) {
      throw new Error(error.message || 'Failed to update delivery status');
    }
    
    if (!data || data.length === 0) {
      return { success: false, message: 'No data returned from update operation' };
    } else {
      return { success: true, data };
    }
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Failed to update delivery status' };
  }
}

async function updateOrderStatus(orderId: string, status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled') {
  try {
    const response = await fetch('/api/orders/update-status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        orderId,
        status,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `API error: ${response.status}`);
    }
    
    const result = await response.json();
    return { success: true, data: result.data };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'API request failed' };
  }
}

export function PedidoActions({ pedido }: PedidoActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleAction = async (
    action: () => Promise<any>,
    successMessage: string,
    errorMessage: string
  ) => {
    if (isUpdating) return;
    
    setIsUpdating(true);
    startTransition(async () => {
      try {
        const response = await action();
        
        if (response && response.success) {
          toast.success(successMessage);
          router.refresh();
          
          setTimeout(() => {
            window.location.reload();
          }, 500);
        } else {
          toast.error(response?.message || errorMessage);
        }
      } catch (error: any) {
        toast.error(error.message || errorMessage);
      } finally {
        setIsUpdating(false);
      }
    });
  };

  const handleEditClick = () => {
    router.push(`/admin/pedidos/edit/${pedido.id}`);
  };

  const handleDeleteClick = () => {
    if (window.confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
      handleAction(
        () => deleteOrder(pedido.id),
        'Order deleted successfully.',
        'Failed to delete order.'
      );
    }
  };

  const isDelivered = pedido.is_delivered || pedido.status === 'delivered';
  const isPaid = pedido.is_paid || pedido.status === 'paid';
  const isShipped = pedido.status === 'shipped';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8" disabled={isPending || isUpdating}>
          {(isPending || isUpdating) ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
          <span className="sr-only">Actions</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel>Order: {pedido.id.substring(0, 8)}...</DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={handleEditClick} disabled={isPending || isUpdating} className="cursor-pointer">
          <PenSquare className="mr-2 h-4 w-4" /> Edit Order
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        
        {isPaid ? (
          <DropdownMenuItem 
            onClick={() => handleAction(
              () => updatePaymentStatus(pedido.id, false), 
              'Order marked as unpaid.',
              'Failed to update payment status.'
            )}
            disabled={isPending || isUpdating || isDelivered}
            className={`text-orange-600 hover:!text-orange-700 cursor-pointer ${isDelivered ? 'opacity-50' : ''}`}
          >
            <XCircle className="mr-2 h-4 w-4" /> Mark as Unpaid
            {isDelivered && <span className="text-xs ml-1">(Cannot unpay delivered items)</span>}
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem 
            onClick={() => handleAction(
              () => updatePaymentStatus(pedido.id, true), 
              'Order marked as paid with current timestamp.',
              'Failed to update payment status.'
            )}
            disabled={isPending || isUpdating}
            className="text-green-600 hover:!text-green-700 cursor-pointer"
          >
            <CreditCard className="mr-2 h-4 w-4" /> Mark as Paid
          </DropdownMenuItem>
        )}

        {!isDelivered && isPaid && !isShipped && (
          <DropdownMenuItem 
            onClick={() => handleAction(
              () => updateOrderStatus(pedido.id, 'shipped'), 
              'Order marked as shipped.',
              'Failed to update order status.'
            )}
            disabled={isPending || isUpdating}
            className="text-blue-600 hover:!text-blue-700 cursor-pointer"
          >
            <Truck className="mr-2 h-4 w-4" /> Mark as Shipped
          </DropdownMenuItem>
        )}
        
        {isDelivered ? (
          <DropdownMenuItem 
            onClick={() => handleAction(
              () => updateDeliveryStatus(pedido.id, false), 
              'Order marked as not delivered.',
              'Failed to update delivery status.'
            )}
            disabled={isPending || isUpdating}
            className="text-orange-600 hover:!text-orange-700 cursor-pointer"
          >
            <PackageMinus className="mr-2 h-4 w-4" /> Mark as Not Delivered
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem 
            onClick={() => handleAction(
              () => updateDeliveryStatus(pedido.id, true), 
              'Order marked as delivered with current timestamp.',
              'Failed to update delivery status.'
            )}
            disabled={isPending || isUpdating}
            className="text-green-600 hover:!text-green-700 cursor-pointer"
          >
            <Truck className="mr-2 h-4 w-4" /> Mark as Delivered
          </DropdownMenuItem>
        )}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={handleDeleteClick} 
          disabled={isPending || isUpdating}
          className="text-red-600 hover:!text-red-700 cursor-pointer"
        >
          <Trash2 className="mr-2 h-4 w-4" /> Delete Order
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}