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
          <DialogTitle>Checkout Options</DialogTitle>
          <DialogDescription>
            You can continue as a guest or create an account to save your
            details for future orders.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <div className="flex flex-col sm:flex-row gap-2 w-full">
            <Button
              onClick={handleGuestCheckout}
              variant="outline"
              className="w-full"
            >
              Continue as Guest
            </Button>
            <Button onClick={handleCreateAccount} className="w-full">
              Create an Account
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 