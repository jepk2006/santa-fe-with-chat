'use client';

import { Button } from '@/components/ui/button';
import { CheckoutDialog } from '@/components/checkout/checkout-dialog';
import { useToast } from '@/hooks/use-toast';
import { formatPrice } from '@/lib/utils';
import Image from 'next/image';
import { useState, useTransition } from 'react';
import { useCart } from '@/hooks/use-cart';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';

function isWeightBasedItem(item: any) {
  // Check both camelCase and snake_case properties for backward compatibility
  const sellingMethod = item.sellingMethod || item.selling_method;
  return sellingMethod === 'weight';
}

export function CartClient() {
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const { items, updateQuantity, removeItem, clearCart, updateWeight } = useCart();

  const total = items.reduce(
    (sum, item) => sum + item.price * (item.selling_method === 'weight' ? (item.weight || 1) : item.quantity),
    0
  );

  const handleCheckout = () => {
    // Open checkout dialog directly without saving cart
    setIsCheckoutOpen(true);
  };

  const handleQuantityChange = (id: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    updateQuantity(id, newQuantity);
  };

  const handleWeightChange = (id: string, newWeight: number) => {
    if (newWeight < 0.1) return;
    updateWeight(id, newWeight);
  };

  const handleRemoveItem = (id: string) => {
    removeItem(id);
    toast({
      description: 'Item removed from cart',
    });
  };

  const handleClearCart = () => {
    clearCart();
    toast({
      description: 'Cart cleared',
    });
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <h2 className="text-2xl font-semibold">Your cart is empty</h2>
        <p className="text-muted-foreground">
          Looks like you haven&apos;t added any items to your cart yet.
        </p>
        <Button asChild>
          <a href="/products">Continue Shopping</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Shopping Cart</h1>
        <Button
          variant="destructive"
          onClick={handleClearCart}
          className="flex items-center gap-2"
        >
          <Trash2 className="h-4 w-4" />
          Clear Cart
        </Button>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={`${item.id}-${item.quantity}`}
              className="flex items-center gap-4 p-4 border rounded-lg transition-all duration-200 ease-in-out hover:border-gray-300 hover:bg-gray-50/50"
            >
              <div className="relative w-20 h-20 overflow-hidden rounded-md flex-shrink-0">
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium">{item.name}</h3>
                    <p className="text-sm font-medium">
                      {formatPrice(item.price * (item.selling_method === 'weight' ? (item.weight || 1) : item.quantity))}
                      {item.selling_method === 'weight' && item.weight_unit && (
                        <span className="text-xs text-muted-foreground ml-1">
                          ({item.weight} {item.weight_unit})
                        </span>
                      )}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveItem(item.id)}
                    className="text-destructive hover:text-destructive/90"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  {isWeightBasedItem(item) ? (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleWeightChange(item.id, Math.max(0.1, (item.weight || 1) - 0.5))}
                        disabled={(item.weight || 1) <= 0.5}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Input
                        type="number"
                        min="0.1"
                        step="0.1"
                        value={item.weight || 1}
                        onChange={(e) => handleWeightChange(item.id, parseFloat(e.target.value) || 0.1)}
                        onBlur={(e) => {
                          if (!e.target.value || isNaN(parseFloat(e.target.value))) {
                            handleWeightChange(item.id, 1);
                          }
                        }}
                        className="w-16 text-center"
                      />
                      <span className="text-sm">{item.weight_unit}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleWeightChange(item.id, (item.weight || 1) + 0.5)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Input
                        type="number"
                        min="1"
                        step="1"
                        value={item.quantity}
                        onChange={(e) => {
                          // Parse to int to ensure whole numbers
                          const value = parseInt(e.target.value);
                          if (!isNaN(value)) {
                            handleQuantityChange(item.id, Math.floor(value));
                          }
                        }}
                        onBlur={(e) => {
                          if (!e.target.value || isNaN(parseInt(e.target.value))) {
                            handleQuantityChange(item.id, 1);
                          }
                        }}
                        className="w-16 text-center"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <div className="p-4 border rounded-lg">
            <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
            <div className="space-y-4">
              <div className="space-y-2">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm py-1">
                    <span className="text-muted-foreground truncate max-w-[70%]">
                      {item.name} {item.selling_method === 'weight' ? 
                        `(${item.weight} ${item.weight_unit})` : 
                        `x ${item.quantity}`}
                    </span>
                    <span className="font-medium">{formatPrice(item.price * (item.selling_method === 'weight' ? (item.weight || 1) : item.quantity))}</span>
                  </div>
                ))}
              </div>
              <div className="border-t pt-2 space-y-2">
                <div className="flex justify-between py-1">
                  <span>Subtotal</span>
                  <span>{formatPrice(total)}</span>
                </div>
                <div className="flex justify-between font-medium py-1">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>
            </div>
            <Button
              className="w-full mt-4"
              onClick={handleCheckout}
              disabled={isPending}
            >
              {isPending ? 'Processing...' : 'Checkout'}
            </Button>
          </div>
        </div>
      </div>

      <CheckoutDialog
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        items={items.map(item => ({
          ...item,
          selling_method: item.selling_method || 'unit',
          weight_unit: (item.weight_unit === 'g' || 
                        item.weight_unit === 'kg' || 
                        item.weight_unit === 'lb' || 
                        item.weight_unit === 'oz') 
                        ? item.weight_unit 
                        : 'kg'
        }))}
        total={total}
      />
    </div>
  );
} 