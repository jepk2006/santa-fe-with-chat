'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { supabaseClient } from '@/lib/supabase';
import { SUPABASE_TABLES } from '@/lib/constants';

interface OrderItem {
  product_id: string;
  quantity: number;
  name?: string;
  price?: number;
  selling_method?: 'unit' | 'weight';
  weight?: number | null;
  weight_unit?: string | null;
}

interface OrderDetails {
  id: string;
  user_id?: string | null;
  items: OrderItem[];
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
}

interface EditOrderFormProps {
  orderDetails: OrderDetails;
}

const formSchema = z.object({
  isPending: z.boolean(),
  isPaid: z.boolean(),
  isShipped: z.boolean(),
  isDelivered: z.boolean(),
  isCancelled: z.boolean(),
}).refine((data) => {
  const statusCount = [
    data.isPending,
    data.isPaid,
    data.isShipped,
    data.isDelivered,
    data.isCancelled
  ].filter(Boolean).length;
  
  return statusCount === 1;
}, {
  message: "Please select exactly one status",
  path: ["isPending"]
});

// Function to determine if we should use orders or carts table
function getTableForOrder(orderDetails: OrderDetails): string {
  // Always use orders table
  return SUPABASE_TABLES.ORDERS;
}

// Function to update order status
async function updateOrderStatus(
  orderId: string, 
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled',
  tableToUse: string
) {
  try {
    // Create update data with status
    const updateData: any = {
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
    } else if (status === 'cancelled') {
      // Keep existing paid/delivered status for canceled orders
    }

    const { data, error } = await supabaseClient
      .from(tableToUse)
      .update(updateData)
      .eq('id', orderId)
      .select();
    
    if (error) {
      throw new Error(error.message || 'Failed to update status');
    }
    
    return { success: true, data };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Failed to update status' };
  }
}

// Function to update payment status
async function updateOrderPaymentStatus(orderId: string, isPaid: boolean, tableToUse: string) {
  try {
    const updateData: any = {
      is_paid: isPaid,
      paid_at: isPaid ? new Date().toISOString() : null,
    };

    // Only update status if changing to paid and current status is compatible
    if (isPaid) {
      // If marking as paid, update status only if current status is 'pending'
      updateData.status = 'paid';
    } else {
      // If marking as unpaid, revert to pending only if current status is 'paid'
      // For other statuses (like shipped, delivered), we shouldn't change the status
      // Get current order to check status
      const { data: currentOrder, error: fetchError } = await supabaseClient
        .from(tableToUse)
        .select('status')
        .eq('id', orderId)
        .single();
      
      if (fetchError) {
        throw new Error(fetchError.message || 'Failed to fetch current order status');
      }
      
      // Only change status to pending if current status is 'paid'
      if (currentOrder?.status === 'paid') {
        updateData.status = 'pending';
      }
      
      // If marking as unpaid, but order is delivered, this is an inconsistent state
      // Don't allow unpaid + delivered combination
      if (currentOrder?.status === 'delivered') {
        throw new Error('Cannot mark a delivered order as unpaid');
      }
    }

    const { data, error } = await supabaseClient
      .from(tableToUse)
      .update(updateData)
      .eq('id', orderId)
      .select();
    
    if (error) {
      throw new Error(error.message || 'Failed to update payment status');
    }
    
    return { success: true, data };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Failed to update payment status' };
  }
}

// Function to update delivery status
async function updateOrderDeliveryStatus(orderId: string, isDelivered: boolean, tableToUse: string) {
  try {
    const updateData: any = {
      is_delivered: isDelivered,
      delivered_at: isDelivered ? new Date().toISOString() : null,
    };
    
    if (isDelivered) {
      // If marking as delivered:
      // 1. Always set status to 'delivered'
      // 2. Ensure it's also marked as paid
      updateData.status = 'delivered';
      updateData.is_paid = true;
      updateData.paid_at = new Date().toISOString();
    } else {
      // If marking as not delivered, we need to determine what status to revert to
      // Get current order to check status and payment info
      const { data: currentOrder, error: fetchError } = await supabaseClient
        .from(tableToUse)
        .select('status, is_paid')
        .eq('id', orderId)
        .single();
      
      if (fetchError) {
        throw new Error(fetchError.message || 'Failed to fetch current order status');
      }
      
      // Only change status from 'delivered' to something else
      if (currentOrder?.status === 'delivered') {
        // If it's paid, revert to 'paid' status
        if (currentOrder.is_paid) {
          updateData.status = 'paid';
        } else {
          // This should rarely happen (delivered but not paid)
          updateData.status = 'pending';
        }
      }
    }

    const { data, error } = await supabaseClient
      .from(tableToUse)
      .update(updateData)
      .eq('id', orderId)
      .select();
    
    if (error) {
      throw new Error(error.message || 'Failed to update delivery status');
    }
    
    return { success: true, data };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Failed to update delivery status' };
  }
}

// Function to update phone number
async function updatePhoneNumber(orderId: string, phoneNumber: string, tableToUse: string) {
  try {
    const { data, error } = await supabaseClient
      .from(tableToUse)
      .update({ phone_number: phoneNumber })
      .eq('id', orderId)
      .select();
    
    if (error) {
      throw new Error(error.message || 'Failed to update phone number');
    }
    
    return { success: true, data };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Failed to update phone number' };
  }
}

export function EditOrderForm({ orderDetails }: EditOrderFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState(orderDetails.status || 'pending');
  const [feedback, setFeedback] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  // Function to update order
  const updateOrder = async (newStatus: string) => {
    setIsSubmitting(true);
    setFeedback(null);
    
    try {
      // Get current timestamp for the status change
      const currentTimestamp = new Date().toISOString();
      
      // Create update payload
      const updateData = {
        status: newStatus,
        is_paid: ['paid', 'shipped', 'delivered'].includes(newStatus),
        is_delivered: newStatus === 'delivered',
        // Always set the timestamps to current time when changing status
        paid_at: ['paid', 'shipped', 'delivered'].includes(newStatus) 
          ? currentTimestamp 
          : null,
        delivered_at: newStatus === 'delivered'
          ? currentTimestamp
          : null
      };
      
      // Call server API with admin key
      const response = await fetch('/api/test-supabase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orderId: orderDetails.id,
          status: newStatus
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setStatus(newStatus);
        setFeedback({
          message: `Order status updated to ${newStatus}`,
          type: 'success'
        });
        toast.success(`Order updated successfully to ${newStatus}`);
        
        // Redirect after a moment
        setTimeout(() => {
          window.location.href = '/admin/pedidos';
        }, 1500);
      } else {
        throw new Error(result.error || 'Failed to update order');
      }
    } catch (error) {
      setFeedback({
        message: error instanceof Error ? error.message : String(error),
        type: 'error'
      });
      toast.error(`Update failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Status option data
  const statusOptions = [
    { id: 'pending', label: 'Pendiente', description: 'Nuevo pedido, aún no procesado', color: 'blue' },
    { id: 'paid', label: 'Pagado', description: 'Pago recibido', color: 'purple' },
    { id: 'shipped', label: 'Enviado', description: 'El pedido ha sido enviado', color: 'yellow' },
    { id: 'delivered', label: 'Entregado', description: 'Pedido completado y entregado', color: 'green' },
    { id: 'cancelled', label: 'Cancelado', description: 'El pedido ha sido cancelado', color: 'red' }
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-medium mb-4">Información del Cliente</h3>
            <div className="space-y-2">
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Cliente:</span>
                <span className="font-medium">
                  {orderDetails.user?.[0]?.name || 'Usuario Invitado'}
                </span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Email:</span>
                <span className="font-medium">
                  {orderDetails.user?.[0]?.email || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Teléfono:</span>
                <span className="font-medium">
                  {orderDetails.phone_number || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Fecha del Pedido:</span>
                <span className="font-medium">
                  {formatDateTime(new Date(orderDetails.created_at)).dateTime}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-medium mb-4">Resumen del Pedido</h3>
            <div className="space-y-3">
              <div className="space-y-1">
                {orderDetails.items.map((item, index) => (
                  <div key={`${item.product_id}-${index}`} className="flex justify-between text-sm">
                    <span>
                      {item.name || 'Producto'} 
                      {item.selling_method === 'weight' && item.weight
                        ? ` - ${item.weight} ${item.weight_unit || ''}`
                        : ` x ${item.quantity}`}
                    </span>
                    <span>{formatCurrency(item.price ? (item.selling_method === 'weight' ? item.price * (item.weight || 0) : item.price * item.quantity) : 0)}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between border-t pt-2 font-semibold">
                <span>Total</span>
                <span>{formatCurrency(orderDetails.total_price)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-medium mb-4">Estado del Pedido</h3>
          <div className="grid gap-4 md:grid-cols-3">
            {statusOptions.map(option => {
              // Determine if this option is the current status
              const isSelected = status === option.id;
              
              // Build class names based on status
              let optionClass = 'transition-all duration-200 border-2 ';
              let indicatorColor = '';
              
              if (option.id === 'pending') {
                optionClass += isSelected ? 'bg-blue-50 border-blue-500' : 'hover:border-blue-300 border-transparent';
                indicatorColor = 'bg-blue-500';
              } else if (option.id === 'paid') {
                optionClass += isSelected ? 'bg-purple-50 border-purple-500' : 'hover:border-purple-300 border-transparent';
                indicatorColor = 'bg-purple-500';
              } else if (option.id === 'shipped') {
                optionClass += isSelected ? 'bg-yellow-50 border-yellow-500' : 'hover:border-yellow-300 border-transparent';
                indicatorColor = 'bg-yellow-500';
              } else if (option.id === 'delivered') {
                optionClass += isSelected ? 'bg-green-50 border-green-500' : 'hover:border-green-300 border-transparent';
                indicatorColor = 'bg-green-500';
              } else if (option.id === 'cancelled') {
                optionClass += isSelected ? 'bg-red-50 border-red-500' : 'hover:border-red-300 border-transparent';
                indicatorColor = 'bg-red-500';
              }
              
              return (
                <div
                  key={option.id}
                  className={`relative flex flex-col items-center justify-between rounded-md p-4 cursor-pointer shadow-sm ${optionClass} ${isSubmitting ? 'opacity-50' : ''}`}
                  onClick={() => !isSubmitting && updateOrder(option.id)}
                >
                  {isSelected && (
                    <div className="absolute top-0 right-0 w-0 h-0 border-t-[25px] border-r-[25px] border-t-transparent border-r-current" style={{ color: indicatorColor }}></div>
                  )}
                  
                  <div className="text-center p-2">
                    <h4 className="font-medium text-base">{option.label}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{option.description}</p>
                  </div>
                  
                  {isSelected && (
                    <div className="absolute bottom-2 w-6 h-1 rounded-full" style={{ backgroundColor: indicatorColor }}></div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Feedback message */}
      {feedback && (
        <Card className={feedback.type === 'success' ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}>
          <CardContent className="pt-6">
            <h3 className={`text-lg font-medium mb-2 ${feedback.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
              {feedback.type === 'success' ? 'Éxito' : 'Error'}
            </h3>
            <p className={`text-sm ${feedback.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>
              {feedback.message}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 