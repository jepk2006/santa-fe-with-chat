import { createClient } from '@/lib/supabase-server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import PaymentClientPage from './payment-client-page';
import { getOrderById } from '@/lib/actions/order.actions';

export default async function PaymentPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Check if this is a temporary order (starts with "temp_")
  if (orderId.startsWith('temp_')) {
    // For temporary orders, we'll handle them in the client component
    // Pass a special marker to indicate this is a temporary order
    const tempOrder = {
      id: orderId,
      isTemporary: true,
      total: 0, // Will be loaded from session storage in client
    };
    return <PaymentClientPage order={tempOrder} />;
  }

  // Handle regular orders from database
  const orderResult = await getOrderById(orderId);

  if (!orderResult) {
    return (
      <div className="container py-10 text-center">
        <h1 className="text-2xl font-bold">Order not found</h1>
        <p>The requested order could not be located.</p>
      </div>
    );
  }

  // If a user is logged in, ensure they own the order.
  // Guests can proceed, but this relies on the obscurity of the orderId for security.
  if (user && orderResult.user_id !== user.id) {
     return (
      <div className="container py-10 text-center">
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p>You do not have permission to view this order.</p>
      </div>
    );
  }
  
  if (orderResult.status === 'paid') {
     // For logged-in users, redirect to their account page.
     // Guests will be redirected to a generic success page or the homepage.
     if (user) {
       return redirect(`/account/order/${orderResult.id}`);
     } else {
       // A dedicated "order success" page for guests would be ideal.
       // For now, redirecting to the homepage.
       return redirect('/');
     }
  }

  return <PaymentClientPage order={orderResult} />;
} 