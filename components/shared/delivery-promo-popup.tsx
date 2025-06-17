'use client';

import { useState, useEffect } from 'react';
import { X, Truck, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { formatCurrency } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export default function DeliveryPromoPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const deliveryThreshold = 450;
  const deliveryFee = 15;

  useEffect(() => {
    // Check if the user has seen this popup before
    const hasSeenPromo = localStorage.getItem('hasSeenDeliveryPromo');
    
    if (!hasSeenPromo) {
      // Show popup after a short delay
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    // Mark as seen so it doesn't show again
    localStorage.setItem('hasSeenDeliveryPromo', 'true');
  };

  const handleShopNow = () => {
    handleClose();
    router.push('/products');
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogTitle className="sr-only">
          Promoción de Envío Gratis
        </DialogTitle>
        <div className="relative p-6">
          {/* Close button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="absolute right-2 top-2 h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>

          {/* Content */}
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-brand-red rounded-full flex items-center justify-center">
              <Truck className="h-8 w-8 text-white" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-gray-900">
                🚚 ¡ENVÍO GRATIS!
              </h2>
              <p className="text-lg text-gray-700">
                En pedidos de <span className="font-bold text-brand-red">{formatCurrency(deliveryThreshold)}</span> o más
              </p>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <p className="text-sm text-orange-800">
                💡 <strong>¡Ahorra dinero!</strong> Los pedidos menores a {formatCurrency(deliveryThreshold)} tienen un costo de envío de solo {formatCurrency(deliveryFee)}
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <Button 
                onClick={handleShopNow}
                className="w-full bg-brand-red hover:bg-opacity-90 text-white"
                size="lg"
              >
                <ShoppingBag className="h-5 w-5 mr-2" />
                Comprar Ahora
              </Button>
              
              <Button 
                onClick={handleClose}
                variant="ghost"
                className="w-full text-gray-500"
              >
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 