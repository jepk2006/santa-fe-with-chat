'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface CheckoutDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CheckoutDialog({ isOpen, onClose }: CheckoutDialogProps) {
  const router = useRouter();

  const handleGuestCheckout = () => {
    router.push('/checkout');
    onClose();
  };

  const handleCreateAccount = () => {
    router.push('/register');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Opciones de Compra</DialogTitle>
          <DialogDescription>
            Puedes continuar como invitado o crear una cuenta para guardar tus
            datos para futuras compras.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <div className="flex flex-col sm:flex-row gap-2 w-full">
            <Button
              onClick={handleGuestCheckout}
              variant="outline"
              className="w-full"
            >
              Continuar como Invitado
            </Button>
            <Button onClick={handleCreateAccount} className="w-full">
              Crear una Cuenta
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 