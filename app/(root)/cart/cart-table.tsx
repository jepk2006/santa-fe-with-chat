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
import { AppError, ErrorResponse, SuccessResponse } from '@/lib/types/error';
import Image from 'next/image';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useTransition, useState } from 'react';
import {
  removeItemFromCart,
  updateCartItemQuantity,
} from '@/lib/actions/cart.actions';
import { Input } from '@/components/ui/input';
import { Scale, Package } from 'lucide-react';

interface CartTableProps {
  items: CartItem[];
  userId: string;
}

function isWeightBasedItem(item: any) {
  // Check both camelCase and snake_case properties for backward compatibility
  const sellingMethod = item.sellingMethod || item.selling_method;
  return sellingMethod === 'weight';
}

function getWeightUnit(item: any) {
  return item.weight_unit || item.weightUnit;
}

const CartTable = ({ items, userId }: CartTableProps) => {
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
          <TableHead>Artículo</TableHead>
          <TableHead>Cantidad</TableHead>
          <TableHead>Precio</TableHead>
          <TableHead>Subtotal</TableHead>
          <TableHead>Acciones</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {items.map((item) => {
          const isWeightBased = isWeightBasedItem(item);
          const subtotal = isWeightBased && item.weight 
            ? item.price * item.weight 
            : item.price * item.quantity;
            
          return (
            <TableRow key={item.id}>
              <TableCell>
                <div className='flex items-center gap-2'>
                  <Image
                    src={item.image}
                    alt={item.name}
                    width={50}
                    height={50}
                    className='rounded-md'
                  />
                  <div>
                    <Link href={`/product/${item.id}`} className='link hover:underline'>
                      {item.name}
                    </Link>
                    <div className="flex items-center mt-1 text-xs text-muted-foreground">
                      {isWeightBased ? (
                        <span className="flex items-center">
                          <Scale className="h-3 w-3 mr-1" />
                          By weight
                        </span>
                      ) : (
                        <span className="flex items-center">
                          <Package className="h-3 w-3 mr-1" />
                          By unit
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </TableCell>

              <TableCell>
                {isWeightBased ? (
                  <div className='flex items-center gap-2'>
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
                <div>
                  {formatPrice(item.price)}
                  {isWeightBased && getWeightUnit(item) && (
                    <span className="text-xs text-muted-foreground">/{getWeightUnit(item)}</span>
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
