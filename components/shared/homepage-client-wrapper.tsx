'use client';

import { ReactNode } from 'react';
import DeliveryPromoPopup from './delivery-promo-popup';

interface HomepageClientWrapperProps {
  children: ReactNode;
}

export default function HomepageClientWrapper({ children }: HomepageClientWrapperProps) {
  return (
    <>
      {children}
      <DeliveryPromoPopup />
    </>
  );
} 