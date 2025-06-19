'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import Image from 'next/image';
import { formatCurrency } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { IMaskInput } from 'react-imask';
import dynamic from 'next/dynamic';
import { AddressObject } from '@/components/ui/address-map';
import { useCart } from '@/hooks/use-cart';
import PickupLocationsMap from '@/components/ui/pickup-locations-map';
import DeliveryPromoBanner from '@/components/shared/delivery-promo-banner';

const AddressMap = dynamic(() => import('@/components/ui/address-map').then(mod => mod.AddressMap), {
  ssr: false,
  loading: () => <p>Cargando mapa...</p>
});

const checkoutSchema = z.object({
  phone_number: z.string().min(1, 'El número de teléfono es requerido'),
  name: z.string().min(1, 'El nombre es requerido'),
  delivery_method: z.enum(['pickup', 'delivery']),
  pickup_location: z.string().optional(),
  shipping_address: z.any().optional(),
}).refine(data => {
  if (data.delivery_method === 'delivery') {
    const address = data.shipping_address as AddressObject | null;
    return address && address.street && address.houseNumber && address.coordinates;
  }
  if (data.delivery_method === 'pickup') {
    return data.pickup_location;
  }
  return true;
}, {
  message: 'Por favor seleccione un punto de retiro o complete la dirección de entrega',
  path: ['pickup_location', 'shipping_address'],
});

function LoadingState() {
  return (
    <div className="text-center flex flex-col items-center justify-center min-h-[400px]">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
      <p className="text-muted-foreground">Cargando carrito...</p>
    </div>
  );
}

function EmptyCartState() {
  return (
    <div className="text-center flex flex-col items-center justify-center min-h-[400px]">
      <p className="text-muted-foreground">Tu carrito está vacío. Serás redirigido en breve.</p>
    </div>
  );
}

export default function CheckoutClientPage({ cart: initialCart, user }: { cart: any, user: any }) {
  const router = useRouter();
  const { items: guestCartItems, clearCart } = useCart();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const { register, handleSubmit, control, watch, formState: { errors }, setValue } = useForm({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      phone_number: user?.phone_number || '',
      name: user?.name || '',
      delivery_method: 'pickup',
      pickup_location: '',
      shipping_address: user?.shipping_address?.address || null,
    },
  });

  const deliveryMethod = watch('delivery_method');

  // Pickup locations with coordinates
  const pickupLocations = [
    { id: 'fabrica', name: 'Fábrica', lat: -17.89044843743826, lng: -63.30959124662632 },
    { id: 'agencia4', name: 'Carnes Express - Santa Fe', lat: -17.762658722069858, lng: -63.17766170185259 },
    { id: 'agencia3', name: 'Agencia #3', lat: -17.80755368139653, lng: -63.21032306211199 },
    { id: 'agencia6', name: 'Agencia #6', lat: -17.802254782800325, lng: -63.18459865767217 }
  ];

  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in kilometers
  };

  // Request user location when pickup is selected
  useEffect(() => {
    if (deliveryMethod === 'pickup' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLat = position.coords.latitude;
          const userLng = position.coords.longitude;
          setUserLocation({ lat: userLat, lng: userLng });
        },
        () => {
          // Silently fail - user will see all locations without distances
        }
      );
    }
  }, [deliveryMethod]);

  const cart = useMemo(() => {
    if (user?.id) {
      return initialCart;
    }
    const guestCartTotal = guestCartItems.reduce(
      (sum, item) => sum + item.price * (item.selling_method === 'weight' ? (item.weight || 1) : item.quantity),
      0
    );
    return {
      items: guestCartItems,
      totalPrice: guestCartTotal,
      id: guestCartItems.length > 0 ? 'guest-cart' : null,
    };
  }, [user, initialCart, guestCartItems]);

  const subtotal = useMemo(() => {
    return cart?.totalPrice || 0;
  }, [cart]);

  const serviceFee = useMemo(() => {
    return subtotal * 0.03;
  }, [subtotal]);

  const deliveryFee = useMemo(() => {
    if (deliveryMethod === 'delivery' && subtotal < 450) {
      return 15;
    }
    return 0;
  }, [deliveryMethod, subtotal]);

  const finalTotal = useMemo(() => {
    return subtotal + serviceFee + deliveryFee;
  }, [subtotal, serviceFee, deliveryFee]);

  const isCartEmpty = useMemo(() => {
    if (!hasMounted) return false;
    return !cart || !cart.items || cart.items.length === 0;
  }, [hasMounted, cart]);

  useEffect(() => {
    if (hasMounted && isCartEmpty) {
      toast.error("Tu carrito está vacío. Redirigiendo...");
      router.push('/cart');
    }
  }, [hasMounted, isCartEmpty, router]);

  const onSubmit = useCallback(async (data: any) => {
    if (!cart?.id) {
      toast.error("No se puede proceder con un carrito vacío.");
      return;
    }
    setIsSubmitting(true);
    try {
      const shippingAddress = data.delivery_method === 'delivery'
        ? { ...data.shipping_address, fullName: data.name }
        : { fullName: data.name };

      const orderData = {
        cartId: cart.id,
        cartItems: cart.items,
        totalPrice: finalTotal,
        subtotal: subtotal,
        serviceFee: serviceFee,
        deliveryFee: deliveryFee,
        phoneNumber: data.phone_number,
        shippingAddress: shippingAddress,
        userId: user?.id || null,
        deliveryMethod: data.delivery_method,
        pickupLocation: data.pickup_location || null,
      };

      const tempOrderId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem(`order_${tempOrderId}`, JSON.stringify(orderData));

      toast.success('Detalles del pedido confirmados. Procediendo al pago.');
      router.push(`/payment/${tempOrderId}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Ocurrió un error inesperado.');
      setIsSubmitting(false);
    }
  }, [cart, router, user, finalTotal, subtotal, serviceFee, deliveryFee]);

  const renderContent = () => {
    if (!hasMounted) {
      return <LoadingState />;
    }
    if (isCartEmpty) {
      return <EmptyCartState />;
    }
    if (!cart) {
      return <LoadingState />;
    }
    return (
      <>
        <h1 className="text-3xl font-bold mb-8">Finalizar Compra</h1>
        
        {deliveryMethod === 'delivery' && (
          <DeliveryPromoBanner 
            currentTotal={subtotal} 
            variant="checkout" 
            showCloseButton={false}
            className="mb-6 rounded-lg"
          />
        )}
        
        <form onSubmit={handleSubmit(onSubmit)} className="grid md:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle>Resumen del Pedido</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {cart.items.map((item: any, index: number) => {
                    const product = item.product || item;
                    return (
                      <div key={item.id || index} className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Image src={product.images?.[0] || product.image || '/images/placeholder.jpg'} alt={product.name} width={64} height={64} className="rounded-md" />
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {item.selling_method === 'weight'
                                ? `Peso: ${item.weight} ${item.weight_unit}`
                                : `Cantidad: ${item.quantity}`}
                            </p>
                          </div>
                        </div>
                        <p>{formatCurrency(item.price * (item.selling_method === 'weight' ? (item.weight || 1) : item.quantity))}</p>
                      </div>
                    );
                  })}
                </div>
                <div className="border-t my-4" />
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <p>Subtotal</p>
                    <p>{formatCurrency(subtotal)}</p>
                  </div>
                  <div className="flex justify-between">
                    <p>Cargo por servicio (3%)</p>
                    <p>{formatCurrency(serviceFee)}</p>
                  </div>
                  {deliveryFee > 0 && (
                    <div className="flex justify-between">
                      <p>Cargo por envío</p>
                      <p>{formatCurrency(deliveryFee)}</p>
                    </div>
                  )}
                </div>
                <div className="border-t my-4" />
                <div className="flex justify-between font-bold text-lg">
                  <p>Total</p>
                  <p>{formatCurrency(finalTotal)}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact and Delivery */}
          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle>Contacto y Entrega</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre Completo</Label>
                  <Input 
                    id="name" 
                    {...register('name')} 
                    placeholder="Juan Pérez" 
                    className="border-2 border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all duration-200"
                  />
                  {errors.name && <p className="text-destructive text-sm mt-1">{(errors.name.message as string) || 'Este campo es requerido'}</p>}
                </div>
                <div className="space-y-3">
                  <Label htmlFor="phone_number" className="block text-sm font-semibold text-gray-800 mb-1">
                    Número de Teléfono
                  </Label>
                  <Controller
                    name="phone_number"
                    control={control}
                    render={({ field }) => (
                      <IMaskInput
                        mask="(0) 000-0000"
                        as="input"
                        placeholder="(7) 123-4567"
                        id="phone_number"
                        value={field.value}
                        onAccept={(value: any) => field.onChange(value)}
                        className="rounded-xl border-2 border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all duration-200 px-4 py-3 text-base shadow-sm hover:border-gray-300 flex h-10 w-full bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    )}
                  />
                  {errors.phone_number && <p className="text-destructive text-sm mt-1">{(errors.phone_number.message as string) || 'Este campo es requerido'}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Método de Entrega</Label>
                  <Controller
                    name="delivery_method"
                    control={control}
                    render={({ field }) => (
                      <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="space-y-2 pt-2">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="pickup" id="pickup" />
                          <Label htmlFor="pickup">Retiro en tienda</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="delivery" id="delivery" />
                          <Label htmlFor="delivery">A domicilio</Label>
                        </div>
                      </RadioGroup>
                    )}
                  />
                </div>
                
                {/* Pickup Location Selector */}
                {deliveryMethod === 'pickup' && (
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold text-gray-800">
                      Selecciona tu punto de retiro
                    </Label>
                    
                    {/* Embedded Map */}
                    <PickupLocationsMap className="mb-4" />
                    

                    <Controller
                      name="pickup_location"
                      control={control}
                      render={({ field }) => (
                        <div className="grid gap-3">
                          {/* Fábrica */}
                          <div className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                            field.value === 'fabrica' 
                              ? 'border-red-500 bg-red-50 ring-2 ring-red-200' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => field.onChange('fabrica')}>
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-lg">🏭</span>
                                  <h3 className="font-semibold text-gray-900">Fábrica</h3>
                                  {userLocation && (
                                    <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                                      {calculateDistance(userLocation.lat, userLocation.lng, -17.89044843743826, -63.30959124662632).toFixed(1)} km
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600 mb-2">Km 17 Doble vía la Guardia</p>
                                <div className="space-y-1 text-xs text-gray-500">
                                  <div className="flex items-center gap-1">
                                    <span>☎️</span>
                                    <span>
                                      <a href="tel:+59133522780" className="text-blue-600 underline hover:text-blue-800 cursor-pointer">3-3522780</a> / <a href="tel:+59133522769" className="text-blue-600 underline hover:text-blue-800 cursor-pointer">3-3522769</a>
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span>📱</span>
                                    <span>
                                      <a href="tel:+59177333052" className="text-blue-600 underline hover:text-blue-800 cursor-pointer">77333052</a> / <a href="tel:+59177393042" className="text-blue-600 underline hover:text-blue-800 cursor-pointer">77393042</a>
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="ml-2">
                                <a 
                                  href="https://maps.app.goo.gl/H7jwWNFbyFcjogzx7" 
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 text-xs underline"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  Ver en Maps
                                </a>
                              </div>
                            </div>
                          </div>

                          {/* Carnes Express - Santa Fe */}
                          <div className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                            field.value === 'agencia4' 
                              ? 'border-red-500 bg-red-50 ring-2 ring-red-200' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => field.onChange('agencia4')}>
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-lg">🏢</span>
                                  <h3 className="font-semibold text-gray-900">Carnes Express - Santa Fe</h3>
                                  {userLocation && (
                                    <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                                      {calculateDistance(userLocation.lat, userLocation.lng, -17.762658722069858, -63.17766170185259).toFixed(1)} km
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600 mb-2">Avenida Banzer C/ Ochoo N° 2010</p>
                                <div className="space-y-1 text-xs text-gray-500">
                                  <div className="flex items-center gap-1">
                                    <span>📱</span>
                                    <span>
                                      <a href="tel:+59175333307" className="text-blue-600 underline hover:text-blue-800 cursor-pointer">75333307</a>
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="ml-2">
                                <a 
                                  href="https://maps.app.goo.gl/46EsUEpMxaSX396R6" 
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 text-xs underline"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  Ver en Maps
                                </a>
                              </div>
                            </div>
                          </div>

                          {/* Agencia #3 */}
                          <div className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                            field.value === 'agencia3' 
                              ? 'border-red-500 bg-red-50 ring-2 ring-red-200' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => field.onChange('agencia3')}>
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-lg">🏢</span>
                                  <h3 className="font-semibold text-gray-900">Agencia #3</h3>
                                  {userLocation && (
                                    <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                                      {calculateDistance(userLocation.lat, userLocation.lng, -17.80755368139653, -63.21032306211199).toFixed(1)} km
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600 mb-2">4to anillo Doble Vía la Guardia</p>
                                <div className="space-y-1 text-xs text-gray-500">
                                  <div className="flex items-center gap-1">
                                    <span>☎️</span>
                                    <span>
                                      <a href="tel:+59133532388" className="text-blue-600 underline hover:text-blue-800 cursor-pointer">3-3532388</a>
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span>📱</span>
                                    <span>
                                      <a href="tel:+59178129634" className="text-blue-600 underline hover:text-blue-800 cursor-pointer">78129634</a>
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="ml-2">
                                <a 
                                  href="https://maps.app.goo.gl/N7eX5nYadZcbGw3p9" 
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 text-xs underline"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  Ver en Maps
                                </a>
                              </div>
                            </div>
                          </div>

                          {/* Agencia #6 */}
                          <div className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                            field.value === 'agencia6' 
                              ? 'border-red-500 bg-red-50 ring-2 ring-red-200' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => field.onChange('agencia6')}>
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-lg">🏢</span>
                                  <h3 className="font-semibold text-gray-900">Agencia #6</h3>
                                  {userLocation && (
                                    <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                                      {calculateDistance(userLocation.lat, userLocation.lng, -17.802254782800325, -63.18459865767217).toFixed(1)} km
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600 mb-2">Av. Pilcomayo #242</p>
                                <div className="space-y-1 text-xs text-gray-500">
                                  <div className="flex items-center gap-1">
                                    <span>☎️</span>
                                    <span>
                                      <a href="tel:+59133557884" className="text-blue-600 underline hover:text-blue-800 cursor-pointer">3-3557884</a>
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span>📱</span>
                                    <span>
                                      <a href="tel:+59177333106" className="text-blue-600 underline hover:text-blue-800 cursor-pointer">77333106</a>
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="ml-2">
                                <a 
                                  href="https://maps.app.goo.gl/HKcEziKVH15yttxW8" 
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 text-xs underline"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  Ver en Maps
                                </a>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    />
                  </div>
                )}

                {/* Conditionally visible Address Map */}
                <div
                  className="space-y-2"
                  style={{ display: deliveryMethod === 'delivery' ? 'block' : 'none' }}
                >
                  <Label htmlFor="shipping_address">Dirección de envío</Label>
                  <AddressMap
                    initialAddress={watch('shipping_address')}
                    onAddressSelect={(address) => setValue('shipping_address', address, { shouldValidate: true })}
                  />
                  {errors.shipping_address && <p className="text-destructive text-sm mt-1">{(errors.shipping_address as any)?.message || 'Por favor, complete la dirección.'}</p>}
                </div>
              </CardContent>
            </Card>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Confirmar Pedido y Pagar'}
            </Button>
          </div>
        </form>
      </>
    );
  }

  return (
    <div className="container py-10">
      {renderContent()}
    </div>
  );
} 