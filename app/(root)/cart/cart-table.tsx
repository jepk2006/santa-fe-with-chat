'use client';

import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatPrice } from '@/lib/utils';
import { CartItem } from '@/types';
import { AppError } from '@/lib/types/error';
import Image from 'next/image';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useTransition, useState } from 'react';
import {
  removeItemFromCart,
  updateCartItemQuantity,
} from '@/lib/actions/cart.actions';
import { Input } from '@/components/ui/input';
import { Scale, Package, MapPin, Tag, Info } from 'lucide-react';

interface CartTableProps {
  items: CartItem[];
}

function isWeightBasedItem(item: CartItem) {
  // Check both camelCase and snake_case properties for backward compatibility
  return item.selling_method === 'weight_custom' || item.selling_method === 'weight_fixed';
}

function isWeightCustomItem(item: CartItem) {
  return item.selling_method === 'weight_custom';
}

function isWeightFixedItem(item: CartItem) {
  return item.selling_method === 'weight_fixed';
}

function getWeightUnit(item: CartItem) {
  return item.weight_unit || (item as any).weightUnit;
}

const CartTable = ({ items }: CartTableProps) => {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [weights, setWeights] = useState<Record<string, number>>({});

  const handleQuantityChange = (productId: string, quantity: number) => {
    if (quantity < 1) return;
    startTransition(async () => {
      try {
        const result = await updateCartItemQuantity(productId, quantity);
        if (!result.success) throw result.error;
        toast({ description: result.message });
      } catch (error) {
        const appError = error as AppError;
        toast({
          variant: 'destructive',
          description: appError.message || 'Failed to update quantity',
        });
      }
    });
  };

  const handleWeightChange = (productId: string, weight: number) => {
    if (weight <= 0) return;
    setWeights(prev => ({ ...prev, [productId]: weight }));
    
    // You'll need to implement a server action for weight updates
    startTransition(async () => {
      try {
        // For now, we'll use the same action but in a real app,
        // you might want to create a separate action for weight updates
        const result = await updateCartItemQuantity(productId, 1, weight);
        if (!result.success) throw result.error;
        toast({ description: result.message });
      } catch (error) {
        const appError = error as AppError;
        toast({
          variant: 'destructive',
          description: appError.message || 'Failed to update weight',
        });
      }
    });
  };

  const handleRemove = (productId: string) => {
    startTransition(async () => {
      try {
        await removeItemFromCart(productId);
        toast({ description: 'Item removed from cart' });
      } catch (error) {
        const appError = error as AppError;
        toast({
          variant: 'destructive',
          description: appError.message || 'Failed to remove item',
        });
      }
    });
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-1/2">Información del Producto</TableHead>
          <TableHead>Cantidad/Peso</TableHead>
          <TableHead>Precio</TableHead>
          <TableHead>Subtotal</TableHead>
          <TableHead>Acciones</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {items.map((item) => {
          const isWeightBased = isWeightBasedItem(item);
          const subtotal = isWeightBased && item.weight 
            ? (item.locked ? item.price : item.price * item.weight) 
            : item.price * item.quantity;
            
          return (
            <TableRow key={item.id}>
              <TableCell>
                <div className='flex items-start gap-3'>
                  <Image
                    src={item.image}
                    alt={item.name}
                    width={80}
                    height={80}
                    className='rounded-lg object-cover'
                  />
                  <div className="flex-1 space-y-2">
                  <div>
                      <Link href={`/product/${(item as any).product_id ?? item.id}`} className='font-medium text-lg hover:underline text-blue-600'>
                      {item.name}
                    </Link>
                    </div>
                    
                    {/* Selling Method Badge */}
                    <div className="flex items-center gap-2">
                      {isWeightBased ? (
                        <div className="flex items-center bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-medium">
                          <Scale className="h-3 w-3 mr-1" />
                          {isWeightCustomItem(item) ? 'Peso Variable' : 'Peso Fijo'}
                        </div>
                      ) : (
                        <div className="flex items-center bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                          <Package className="h-3 w-3 mr-1" />
                          Por Unidad
                        </div>
                      )}
                    </div>

                    {/* Product Details */}
                    <div className="space-y-1 text-sm text-gray-600">
                      {isWeightFixedItem(item) && (item as any).location_name && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-gray-400" />
                          <span className="font-medium">{(item as any).location_name}</span>
                          {(item as any).location_address && (
                            <span className="text-gray-500">• {(item as any).location_address}</span>
                          )}
                        </div>
                      )}
                      
                      {isWeightBased && item.weight && (
                        <div className="flex items-center gap-1">
                          <Scale className="h-3 w-3 text-gray-400" />
                          <span>Peso: <strong>{item.weight} {getWeightUnit(item)}</strong></span>
                          {isWeightFixedItem(item) && (
                            <span className="text-gray-500">• Unidad específica</span>
                          )}
                        </div>
                      )}
                      
                      {isWeightCustomItem(item) && (
                        <div className="flex items-center gap-1">
                          <Info className="h-3 w-3 text-gray-400" />
                          <span className="text-gray-500">Peso seleccionado por cliente</span>
                        </div>
                      )}
                      
                      {(item as any).inventory_id && (
                        <div className="flex items-center gap-1">
                          <Tag className="h-3 w-3 text-gray-400" />
                          <span className="text-gray-400 text-xs">ID: {(item as any).inventory_id.slice(-8)}</span>
                        </div>
                      )}
                    </div>

                    {/* Price Information */}
                    <div className="text-sm">
                      <span className="text-gray-500">Precio unitario: </span>
                      <span className="font-medium">{formatPrice(item.price)}</span>
                      {isWeightCustomItem(item) && getWeightUnit(item) && (
                        <span className="text-gray-500">/{getWeightUnit(item)}</span>
                      )}
                    </div>
                  </div>
                </div>
              </TableCell>

              <TableCell>
                {isWeightBased ? (
                  <div className='flex items-center gap-2'>
                    {isWeightFixedItem(item) || item.locked ? (
                      <span>{item.weight} {getWeightUnit(item)}</span>
                    ) : (
                      <>
                    <Input
                      type="number"
                      min={0.1}
                      step={0.1}
                      value={weights[item.id] || item.weight || 0}
                      onChange={(e) => handleWeightChange(item.id, parseFloat(e.target.value))}
                      className="w-20 h-9"
                      disabled={isPending}
                    />
                    <span>{getWeightUnit(item)}</span>
                      </>
                    )}
                  </div>
                ) : (
                  <div className='flex items-center gap-2'>
                    <Button
                      variant='outline'
                      size='icon'
                      disabled={isPending}
                      onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                    >
                      -
                    </Button>
                    <span className="min-w-[2rem] text-center px-2 py-1 border rounded-md">{item.quantity}</span>
                    <Button
                      variant='outline'
                      size='icon'
                      disabled={isPending}
                      onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                    >
                      +
                    </Button>
                  </div>
                )}
              </TableCell>

              <TableCell>
                <div className="space-y-1">
                  <div className="font-medium">{formatPrice(item.price)}</div>
                  {isWeightCustomItem(item) && getWeightUnit(item) && (
                    <div className="text-xs text-gray-500">por {getWeightUnit(item)}</div>
                  )}
                  {isWeightFixedItem(item) && (
                    <div className="text-xs text-gray-500">unidad fija</div>
                  )}
                  {!isWeightBased && (
                    <div className="text-xs text-gray-500">por unidad</div>
                  )}
                </div>
              </TableCell>
              
              <TableCell>{formatPrice(subtotal)}</TableCell>

              <TableCell>
                <Button
                  variant='destructive'
                  size='sm'
                  disabled={isPending}
                  onClick={() => handleRemove(item.id)}
                >
                  Remove
                </Button>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};

export default CartTable;
