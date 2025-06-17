'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import Image from 'next/image';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { markOrderAsPaid, createOrderAfterPayment } from '@/lib/actions/order.actions';
import { useCart } from '@/hooks/use-cart';

interface Order {
  id: string;
  total: number;
  isTemporary?: boolean;
  // Add other order properties as needed
}

export default function PaymentClientPage({ order }: { order: Order }) {
  const router = useRouter();
  const { clearCart } = useCart();
  const [isLoading, setIsLoading] = useState(true);
  const [isPolling, setIsPolling] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<{ 
    transactionId: string; 
    qrImageUrl: string; 
    qrId?: string;
    expiresAt?: string;
    isMock?: boolean;
    message?: string;
  } | null>(null);
  const [tempOrderData, setTempOrderData] = useState<any>(null);

  // Load temporary order data if this is a temp order
  useEffect(() => {
    if (order.isTemporary) {
      const storedData = sessionStorage.getItem(`order_${order.id}`);
      if (storedData) {
        const orderData = JSON.parse(storedData);
        setTempOrderData(orderData);
        // Update the order total from temp data
        order.total = orderData.totalPrice;
      } else {
        toast.error('Order data not found. Please try again.');
        router.push('/cart');
        return;
      }
    }
  }, [order.isTemporary, order.id, router]);

  useEffect(() => {
    const createPayment = async () => {
      try {
        setIsLoading(true);
        const paymentRes = await fetch('/api/payment/create-qr', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: order.id, amount: order.total }),
        });

        if (!paymentRes.ok) {
          throw new Error('Failed to create payment QR code.');
        }

        const paymentData = await paymentRes.json();
        setPaymentDetails(paymentData);
        setIsPolling(true);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'An unexpected error occurred.');
      } finally {
        setIsLoading(false);
      }
    };

    // Only create payment if we have order total (either from DB or temp data)
    if (order.total > 0 || (!order.isTemporary)) {
      createPayment();
    }
  }, [order.id, order.total, order.isTemporary]);

  useEffect(() => {
    if (!paymentDetails || !isPolling) return;

    const intervalId = setInterval(async () => {
      try {
        const res = await fetch(`/api/payment/status?transactionId=${paymentDetails.transactionId}`);
        const data = await res.json();

        if (data.status === 'paid') {
          setIsPolling(false);
          clearInterval(intervalId);
          toast.success('Payment confirmed!');
          
          if (order.isTemporary && tempOrderData) {
            // Create the real order in database after payment success
            const orderResult = await createOrderAfterPayment({
              cartId: tempOrderData.cartId,
              cartItems: tempOrderData.cartItems,
              totalPrice: tempOrderData.totalPrice,
              subtotal: tempOrderData.subtotal,
              serviceFee: tempOrderData.serviceFee,
              deliveryFee: tempOrderData.deliveryFee,
              phoneNumber: tempOrderData.phoneNumber,
              shippingAddress: tempOrderData.shippingAddress,
              userId: tempOrderData.userId,
              deliveryMethod: tempOrderData.deliveryMethod,
              pickupLocation: tempOrderData.pickupLocation,
            });

            if (orderResult.success) {
              // Clear cart and session storage
              if (!tempOrderData.userId) {
                clearCart(); // Clear guest cart
              }
              sessionStorage.removeItem(`order_${order.id}`);
              
              // Redirect to the real order
              if (tempOrderData.userId) {
                router.push(`/account/order/${orderResult.orderId}`);
              } else {
                router.push(`/order-details/${orderResult.orderId}`);
              }
            } else {
              toast.error('Payment successful but failed to create order. Please contact support.');
            }
          } else {
            // Handle existing database orders
            await markOrderAsPaid(order.id);
            router.push(`/account/order/${order.id}`);
          }
        }
      } catch (error) {
        toast.error('Could not verify payment status.');
        setIsPolling(false);
        clearInterval(intervalId);
      }
    }, 3000);

    return () => clearInterval(intervalId);
  }, [paymentDetails, isPolling, router, order.id, order.isTemporary, tempOrderData, clearCart]);
  
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin" />
          <p className="text-muted-foreground">Generating QR Code...</p>
        </div>
      );
    }

    if (paymentDetails) {
      return (
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="relative">
            <Image 
              src={paymentDetails.qrImageUrl} 
              alt="QR Code for payment" 
              width={300} 
              height={300}
              className="border rounded-lg"
            />
            {paymentDetails.isMock && (
              <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded">
                DEMO
              </div>
            )}
          </div>
          
          <div className="text-center space-y-2">
            <p className="font-bold text-2xl">{formatCurrency(order.total)}</p>
            {paymentDetails.qrId && (
              <p className="text-xs text-muted-foreground">QR ID: {paymentDetails.qrId}</p>
            )}
            {paymentDetails.expiresAt && (
              <p className="text-xs text-muted-foreground">
                Expires: {new Date(paymentDetails.expiresAt).toLocaleString()}
              </p>
            )}
          </div>

          <div className="flex items-center space-x-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>
              {paymentDetails.isMock 
                ? 'Simulating payment confirmation...' 
                : 'Waiting for payment confirmation...'
              }
            </span>
          </div>

          {paymentDetails.message && (
            <p className="text-sm text-center text-yellow-600 bg-yellow-50 p-2 rounded">
              {paymentDetails.message}
            </p>
          )}

          <div className="text-center text-sm text-muted-foreground max-w-md">
            <p>Scan this QR code with your banking app to complete the payment.</p>
            {paymentDetails.isMock && (
              <p className="text-yellow-600 mt-2">
                ⚠️ This is a demonstration. No real payment will be processed.
              </p>
            )}
          </div>
        </div>
      );
    }
    
    return <p className="text-destructive">Could not load payment details. Please try again.</p>;
  };

  return (
    <div className="container py-10 max-w-lg mx-auto text-center">
      <Card>
        <CardHeader>
          <CardTitle>Complete Your Payment</CardTitle>
          <CardDescription>
            Scan the QR code below to pay for your order. We will automatically detect the payment.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderContent()}
        </CardContent>
      </Card>
    </div>
  );
} 