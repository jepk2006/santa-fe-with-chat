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

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Sign in with Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      // Handle Supabase auth errors directly - don't throw
      if (authError) {
        // Check for invalid credentials more flexibly
        if (authError.message.toLowerCase().includes('invalid') && 
            authError.message.toLowerCase().includes('credentials')) {
          toast.error('Invalid email or password. Please try again.', {
            id: 'login-error',
          });
        } else {
          toast.error(authError.message || 'An error occurred during login');
        }
        setIsLoading(false);
        return; // Exit early - don't proceed with the rest of the function
      }

      // Ensure we have a user before proceeding
      if (!authData?.user) {
        toast.error('No user returned from authentication');
        setIsLoading(false);
        return;
      }

      // Get user role from the users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', authData.user.id)
        .single();

      // Handle database query errors - don't throw
      if (userError) {
        toast.error(userError.message || 'Error retrieving user data');
        setIsLoading(false);
        return;
      }

      // Check user role - don't throw an error
      if (!userData || (userData.role !== 'admin' && userData.role !== 'ventas')) {
        toast.error('You do not have permission to access this area.');
        setIsLoading(false);
        return;
      }

      // Success path
      toast.success('Login successful');

      // Redirect to admin panel
      router.push('/admin');
      router.refresh();
    } catch (error) {
      // Fallback error handler for any unexpected errors
      console.error('Unexpected login error:', error);
      toast.error(error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@example.com"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
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