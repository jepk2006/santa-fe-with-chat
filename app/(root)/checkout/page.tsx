import { createClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import { getMyCart } from '@/lib/actions/cart.actions';
import CheckoutClientPage from './checkout-client-page';

export const dynamic = 'force-dynamic';

export default async function CheckoutPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let cart = null;
  let profile = null;

  if (user) {
    cart = await getMyCart();
    // if (!cart || !cart.items || cart.items.length === 0) {
    //   return redirect('/cart');
    // }

    const { data } = await supabase
      .from('users')
      .select('name, phone_number, shipping_address')
      .eq('id', user.id)
      .single();
    profile = data;
  }
  
  // For guest users, `cart` will be null here. 
  // The `CheckoutClientPage` will be responsible for fetching the cart from localStorage.

  const userProp = {
        id: user?.id,
        email: user?.email,
        name: profile?.name,
        phone_number: profile?.phone_number,
        shipping_address: profile?.shipping_address
  };

  return (
    <CheckoutClientPage
      cart={cart}
      user={userProp}
    />
  );
} 