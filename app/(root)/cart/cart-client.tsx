'use client';

import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { formatPrice } from '@/lib/utils';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useCart } from '@/hooks/use-cart';
import { Minus, Plus, Trash2, Scale, MapPin, Info } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase-client';
import CheckoutDialog from '@/components/shared/checkout-dialog';
import DeliveryPromoBanner from '@/components/shared/delivery-promo-banner';

interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  selling_method: 'unit' | 'weight_custom' | 'weight_fixed';
  weight_unit?: string;
  weight?: number | null;
  locked?: boolean;
  location_id?: string;
  location_name?: string;
  location_address?: string;
  inventory_id?: string;
  product_id?: string;
}

function isWeightBasedItem(item: CartItem) {
  return item.selling_method === 'weight_custom' || item.selling_method === 'weight_fixed';
}

function isWeightCustomItem(item: CartItem) {
  return item.selling_method === 'weight_custom';
}

function isWeightFixedItem(item: CartItem) {
  return item.selling_method === 'weight_fixed';
}

export function CartClient() {
  const { toast } = useToast();
  const { items, updateQuantity, removeItem, clearCart, updateWeight } = useCart();
  const [isCheckoutDialogOpen, setCheckoutDialogOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_evt, session) => {
      setUser(session?.user ?? null);
    });

    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    return () => subscription.unsubscribe();
  }, []);

  const total = items.reduce(
    (sum, item) => {
      if (item.selling_method === 'weight_custom' || item.selling_method === 'weight_fixed') {
        return sum + (item.locked ? item.price : item.price * (item.weight || 1));
      }
      return sum + item.price * item.quantity;
    },
    0
  );

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

  const handleCheckout = () => {
    if (user) {
      router.push('/checkout');
    } else {
      setCheckoutDialogOpen(true);
    }
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <h2 className="text-2xl font-semibold font-heading">Tu carrito está vacío</h2>
        <p className="text-muted-foreground font-sans">
          Parece que aún no has agregado ningún artículo a tu carrito.
        </p>
        <Button asChild className="font-sans">
          <a href="/products">Continuar Comprando</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <DeliveryPromoBanner 
        currentTotal={total} 
        variant="cart" 
        showCloseButton={false}
        className="mb-6 rounded-lg"
      />

      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold font-heading">Carrito de Compras</h1>
        <Button
          variant="destructive"
          onClick={handleClearCart}
          className="flex items-center gap-2 font-sans"
        >
          <Trash2 className="h-4 w-4" />
          Vaciar Carrito
        </Button>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={`${item.id}-${item.quantity}`}
              className="border rounded-lg p-6 transition-all duration-200 ease-in-out hover:border-gray-300 hover:bg-gray-50/50 hover:shadow-sm"
            >
              <div className="flex items-start gap-6">
                <div className="relative w-24 h-24 overflow-hidden rounded-lg flex-shrink-0">
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  className="object-cover"
                    sizes="96px"
                />
              </div>
                
                <div className="flex-1 space-y-3">
                  {/* Product Name and Actions Row */}
                <div className="flex items-start justify-between">
                  <div>
                      <h3 className="font-heading font-semibold text-lg text-gray-900">{item.name}</h3>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveItem(item.id)}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                  {/* Product Details */}
                  <div className="space-y-2">
                    {isWeightFixedItem(item) && item.location_name && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 font-sans">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">{item.location_name}</span>
                        {item.location_address && (
                          <span className="text-gray-500">• {item.location_address}</span>
                        )}
                      </div>
                    )}
                    
                    {isWeightBasedItem(item) && item.weight && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 font-sans">
                        <Scale className="h-4 w-4 text-gray-400" />
                        <span>Peso: <strong>{item.weight} {item.weight_unit}</strong></span>
                      </div>
                    )}
                    
                    {isWeightCustomItem(item) && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 font-sans">
                        <Info className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-500">Peso seleccionado por cliente</span>
                      </div>
                    )}
                  </div>

                  {/* Price and Quantity/Weight Controls */}
                  <div className="flex items-center justify-between pt-2">
                    <div className="space-y-1">
                      <div className="text-sm text-gray-500 font-sans">
                        Precio unitario: <span className="font-medium text-gray-900">
                          {item.locked && item.weight ? (
                            // For weight_fixed products, show price per kg
                            <>
                              {formatPrice(item.price / item.weight)}
                              <span className="text-gray-500">/{item.weight_unit}</span>
                            </>
                          ) : (
                            // For weight_custom and unit products
                            <>
                              {formatPrice(item.price)}
                              {isWeightCustomItem(item) && item.weight_unit && (
                                <span className="text-gray-500">/{item.weight_unit}</span>
                              )}
                            </>
                          )}
                        </span>
                      </div>
                      
                      {/* Show multiplication for weight-based products */}
                      {isWeightBasedItem(item) && item.weight && (
                        <div className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-md border">
                          <span className="font-sans font-medium text-gray-800">
                            {item.locked && item.weight ? (
                              // For weight_fixed products, show price per kg calculation
                              <>
                                {formatPrice(item.price / item.weight)} × {item.weight} {item.weight_unit} = {formatPrice(item.price)}
                              </>
                            ) : (
                              // For weight_custom products, price is already per kg
                              <>
                                {formatPrice(item.price)} × {item.weight} {item.weight_unit} = {formatPrice(item.price * item.weight)}
                              </>
                            )}
                          </span>
                          {item.locked && (
                            <span className="ml-2 text-xs text-gray-500 font-sans">(Peso fijo)</span>
                          )}
                        </div>
                      )}
                      
                      <div className="text-lg font-semibold text-gray-900 font-sans">
                        Total: {formatPrice(
                          (item.selling_method === 'weight_custom' || item.selling_method === 'weight_fixed')
                            ? (item.locked ? item.price : item.price * (item.weight || 1))
                            : item.price * item.quantity
                        )}
                      </div>
                    </div>

                    {/* Quantity/Weight Controls */}
                    <div className="flex items-center gap-3">
                  {isWeightBasedItem(item) ? (
                        item.locked ? (
                          <div className="text-sm text-gray-600 bg-gray-100 px-3 py-2 rounded-lg border-2 border-gray-300 font-sans">
                            <span className="font-medium">{item.weight} {item.weight_unit}</span>
                            <span className="text-gray-500 ml-1">(Fijo)</span>
                          </div>
                        ) : (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleWeightChange(item.id, Math.max(0.1, (item.weight || 1) - 0.5))}
                        disabled={(item.weight || 1) <= 0.5}
                              className="h-9 w-9"
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
                              className="w-20 text-center font-sans border-2 border-gray-300 focus:border-blue-500"
                      />
                            <span className="text-sm font-medium text-gray-600 font-sans">{item.weight_unit}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleWeightChange(item.id, (item.weight || 1) + 0.5)}
                              className="h-9 w-9"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                        )
                  ) : (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                            className="h-9 w-9"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                          <span className="w-12 text-center py-2 px-3 border rounded-md font-medium font-sans">
                            {item.quantity}
                          </span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                            className="h-9 w-9"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <div className="p-4 border rounded-lg">
            <h2 className="text-lg font-semibold mb-4 font-heading">Resumen del Pedido</h2>
            <div className="space-y-4">
              <div className="space-y-2">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm py-1 font-sans">
                    <span className="text-muted-foreground truncate max-w-[70%]">
                      {item.name} {(item.selling_method === 'weight_custom' || item.selling_method === 'weight_fixed') ? 
                        `(${item.weight} ${item.weight_unit})` : 
                        `x ${item.quantity}`}
                    </span>
                    <span className="font-medium">{formatPrice((item.selling_method === 'weight_custom' || item.selling_method === 'weight_fixed') ? (item.locked ? item.price : item.price * (item.weight || 1)) : item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t pt-2 space-y-2">
                <div className="flex justify-between py-1 font-sans">
                  <span>Subtotal</span>
                  <span>{formatPrice(total)}</span>
                </div>
                <div className="flex justify-between font-medium py-1 font-sans">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>
            </div>
            <Button
              className="w-full mt-4 font-sans"
              onClick={handleCheckout}
            >
              Finalizar Compra
            </Button>
          </div>
        </div>
      </div>
      <CheckoutDialog
        isOpen={isCheckoutDialogOpen}
        onClose={() => setCheckoutDialogOpen(false)}
      />
    </div>
  );
} 