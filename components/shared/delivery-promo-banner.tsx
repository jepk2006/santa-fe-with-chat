'use client';

import { useState } from 'react';
import { X, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';

interface DeliveryPromoBannerProps {
  currentTotal?: number;
  showCloseButton?: boolean;
  variant?: 'banner' | 'cart' | 'checkout';
  className?: string;
}

export default function DeliveryPromoBanner({ 
  currentTotal = 0, 
  showCloseButton = true, 
  variant = 'banner',
  className = ''
}: DeliveryPromoBannerProps) {
  const [isVisible, setIsVisible] = useState(true);
  const deliveryThreshold = 450;
  const deliveryFee = 15;
  const remaining = deliveryThreshold - currentTotal;
  const hasReachedThreshold = currentTotal >= deliveryThreshold;

  if (!isVisible) return null;

  const getBannerContent = () => {
    switch (variant) {
      case 'cart':
      case 'checkout':
        if (hasReachedThreshold) {
          return (
            <div className="flex items-center gap-2 text-green-700">
              <Truck className="h-5 w-5" />
              <span className="font-semibold">🎉 ¡Felicidades! Tienes envío GRATIS</span>
            </div>
          );
        } else {
          return (
            <div className="flex items-center gap-2 text-orange-700">
              <Truck className="h-5 w-5" />
              <span>
                <span className="font-semibold">¡Faltan solo {formatCurrency(remaining)}</span> para envío GRATIS!
              </span>
            </div>
          );
        }
      
      default:
        return (
          <div className="flex items-center gap-2 text-white">
            <Truck className="h-5 w-5" />
            <span className="font-semibold">
              ENVÍO GRATIS en pedidos de {formatCurrency(deliveryThreshold)} o más
            </span>
          </div>
        );
    }
  };

  const getBannerStyles = () => {
    switch (variant) {
      case 'cart':
      case 'checkout':
        return hasReachedThreshold 
          ? "bg-green-50 border border-green-200 text-green-800"
          : "bg-orange-50 border border-orange-200 text-orange-800";
      
      default:
        return "bg-brand-blue text-white"; // Using brand-blue (dark blue)
    }
  };

  return (
    <div className={`relative ${getBannerStyles()} ${className}`}>
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex-1 flex items-center justify-center">
            {getBannerContent()}
          </div>
          
          {showCloseButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsVisible(false)}
              className={`absolute right-2 h-6 w-6 p-0 ${
                variant === 'banner' 
                  ? 'text-white hover:bg-white/20' 
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        {variant === 'banner' && (
          <div className="text-center text-xs mt-1 text-white/80">
            Solo {formatCurrency(deliveryFee)} de envío en pedidos menores a {formatCurrency(deliveryThreshold)}
          </div>
        )}
      </div>
    </div>
  );
} 