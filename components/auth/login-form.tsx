'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { AuthApiError } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useCart } from '@/hooks/use-cart';
import { saveCart } from '@/lib/actions/cart.actions';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { items: cartItems, clearCart } = useCart();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        const msgLower = authError.message.toLowerCase();
        if (msgLower.includes('email') && msgLower.includes('confirm')) {
          toast.error('Tu correo aún no ha sido confirmado. Revisa tu bandeja o reenvía la confirmación.', { id: 'confirm-email' });
          const { error: resendError } = await supabase.auth.resend({ type: 'signup', email });
          if (!resendError) {
            toast.success('Correo de confirmación reenviado');
          }
        } else if (msgLower.includes('invalid') && msgLower.includes('credentials')) {
          toast.error('Email o contraseña incorrectos. Intenta nuevamente.', {
            id: 'login-error',
          });
        } else {
          toast.error(authError.message || 'An error occurred during login');
        }
        return;
      }

      if (!authData?.user) {
        toast.error('No user returned from authentication');
        return;
      }

      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', authData.user.id)
        .single();

      const role = userData?.role || 'customer';

      if (cartItems.length > 0) {
        const total = cartItems.reduce(
          (sum, item) => sum + item.price * (item.selling_method === 'weight' ? (item.weight || 1) : item.quantity),
          0
        );
        
        const cartItemsWithValidWeightUnits = cartItems.map(item => ({
          ...item,
          weight_unit: item.weight_unit as 'g' | 'kg' | 'lb' | 'oz' | null | undefined
        }));
        
        await saveCart(cartItemsWithValidWeightUnits, total);
        clearCart();
        toast.info('Your guest cart has been merged with your account.');
      }

      toast.success('Inicio de sesión exitoso');

      if (role === 'admin' || role === 'ventas') {
        router.push('/admin/overview');
      } else {
        router.push('/account');
      }
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Ocurrió un error inesperado. Por favor, inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="email">Correo Electrónico</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="nombre@ejemplo.com"
          className="border-2 border-gray-300 focus:border-brand-blue"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Contraseña</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border-2 border-gray-300 focus:border-brand-blue"
          required
        />
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Iniciando sesión...
          </>
        ) : (
          'Iniciar Sesión'
        )}
      </Button>
    </form>
  );
}