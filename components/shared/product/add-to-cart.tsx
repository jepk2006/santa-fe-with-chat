'use client';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Plus, Minus, Loader } from 'lucide-react';
import { Cart, CartItem } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { addItemToCart, removeItemFromCart } from '@/lib/actions/cart.actions';
import { useTransition } from 'react';

const AddToCart = ({ cart, item }: { cart?: Cart; item: CartItem }) => {
  const router = useRouter();
  const { toast } = useToast();

  const [isPending, startTransition] = useTransition();

  const handleAddToCart = async () => {
    startTransition(async () => {
      try {
        const res = await addItemToCart(item.id, 1, {
          name: item.name,
          price: item.price,
          image: item.image
        });

        // Handle success add to cart
        toast({
          description: 'Item added to cart successfully',
          action: (
            <ToastAction
              className='bg-primary text-white hover:bg-gray-800'
              altText='Go To Cart'
              onClick={() => router.push('/cart')}
            >
              Go To Cart
            </ToastAction>
          ),
        });
      } catch (error: any) {
        toast({
          variant: 'destructive',
          description: error.message || 'Failed to add item to cart',
        });
      }
    });
  };

  // Handle remove from cart
  const handleRemoveFromCart = async () => {
    startTransition(async () => {
      try {
        await removeItemFromCart(item.id);

        toast({
          description: 'Item removed from cart',
        });
      } catch (error: any) {
        toast({
          variant: 'destructive',
          description: error.message || 'Failed to remove item from cart',
        });
      }
    });
  };

  // Check if item is in cart
  const existItem =
    cart && cart.items.find((x) => x.id === item.id);

  return existItem ? (
    <div>
      <Button type='button' variant='outline' onClick={handleRemoveFromCart}>
        {isPending ? (
          <Loader className='w-4 h-4 animate-spin' />
        ) : (
          <Minus className='w-4 h-4' />
        )}
      </Button>
      <span className='px-2'>{existItem.quantity}</span>
      <Button type='button' variant='outline' onClick={handleAddToCart}>
        {isPending ? (
          <Loader className='w-4 h-4 animate-spin' />
        ) : (
          <Plus className='w-4 h-4' />
        )}
      </Button>
    </div>
  ) : (
    <Button className='w-full' type='button' onClick={handleAddToCart}>
      {isPending ? (
        <Loader className='w-4 h-4 animate-spin' />
      ) : (
        <Plus className='w-4 h-4' />
      )}{' '}
      Add To Cart
    </Button>
  );
};

export default AddToCart;
