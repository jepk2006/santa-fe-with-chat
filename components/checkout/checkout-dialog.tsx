'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { formatPrice } from '@/lib/utils';
import { CartItem } from '@/types';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createDirectOrder } from '@/lib/actions/order.actions';
import { useCart } from '@/hooks/use-cart';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DEPARTAMENTOS } from '@/lib/constants/departamentos';

interface CheckoutDialogProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  total: number;
}

export function CheckoutDialog({
  isOpen,
  onClose,
  items,
  total,
}: CheckoutDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [shippingAddress, setShippingAddress] = useState({
    fullName: '',
    city: 'Santa Cruz',
    phoneNumber: '',
  });
  const router = useRouter();
  const { toast } = useToast();
  const { clearCart } = useCart();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Create order directly without using the carts table
      await createDirectOrder(
        items, 
        total, 
        {
          fullName: shippingAddress.fullName,
          phoneNumber: shippingAddress.phoneNumber,
          city: shippingAddress.city
        }
      );

      toast({
        description: 'Order placed successfully!',
      });

      // Clear the cart after successful order
      clearCart();
      
      // Close the dialog without redirecting
      onClose();
    } catch (error) {
      toast({
        variant: 'destructive',
        description: error instanceof Error ? error.message : 'Failed to place order',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Function to format phone numbers as (X) XXX-XXXX
  const formatPhoneNumber = (value: string) => {
    // Allow empty input by returning empty string
    if (!value) return '';
    
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, '');
    
    // If there are no digits left, return empty string
    if (digits.length === 0) return '';
    
    // Format phone number based on length with pattern (X) XXX-XXXX
    if (digits.length === 1) {
      return `(${digits})`;
    } else if (digits.length <= 4) {
      return `(${digits.charAt(0)}) ${digits.substring(1)}`;
    } else if (digits.length <= 8) {
      return `(${digits.charAt(0)}) ${digits.substring(1, 4)}-${digits.substring(4)}`;
    } else {
      // If too many digits, truncate at 8
      return `(${digits.charAt(0)}) ${digits.substring(1, 4)}-${digits.substring(4, 8)}`;
    }
  };

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    if (!inputValue) {
      setShippingAddress({
        ...shippingAddress,
        phoneNumber: '',
      });
      return;
    }
    
    const formattedValue = formatPhoneNumber(inputValue);
    setShippingAddress({
      ...shippingAddress,
      phoneNumber: formattedValue,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Checkout</DialogTitle>
          <DialogDescription>
            Enter your shipping details to complete your order.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-medium">Order Summary</h3>
              <div className="space-y-2">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>
                      {item.name} x {item.quantity}
                    </span>
                    <span>{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
                <div className="border-t pt-2">
                  <div className="flex justify-between font-medium">
                    <span>Total</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Nombre Completo</Label>
                <Input
                  id="fullName"
                  value={shippingAddress.fullName}
                  onChange={(e) =>
                    setShippingAddress({
                      ...shippingAddress,
                      fullName: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Número de telefono</Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  placeholder="(7) 123-4567"
                  value={shippingAddress.phoneNumber}
                  onChange={handlePhoneNumberChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">Departamento</Label>
                <Select
                  value={shippingAddress.city}
                  onValueChange={(value) =>
                    setShippingAddress({
                      ...shippingAddress,
                      city: value,
                    })
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un departamento" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTAMENTOS.map((departamento) => (
                      <SelectItem key={departamento} value={departamento}>
                        {departamento}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <DialogFooter>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? 'Processing...' : 'Place Order'}
                </Button>
              </DialogFooter>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 