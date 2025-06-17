'use client';
import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { registerUser } from '@/lib/actions/auth.actions';

export default function RegisterForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Clear any existing invalid sessions to prevent JWT errors
      await supabase.auth.signOut();
      
      const registrationData = {
        email,
        password,
        name,
        phone: phone // Send the actual phone value, don't convert to undefined
      };
      
      // Use server action for registration
      const result = await registerUser(registrationData);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success(result.message);
      setRegistered(true);
    } catch (err: any) {
      // If it's a JWT error, clear the session and try again
      if (err.message && err.message.includes('JWT')) {
        await supabase.auth.signOut();
        toast.error('Session cleared. Please try registration again.');
      } else {
        toast.error(err.message || 'Registration failed');
      }
    } finally {
      setLoading(false);
    }
  };

  if (registered) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm">Te enviamos un correo para confirmar tu cuenta; revisa tu bandeja.</p>
        <Button
          type="button"
          onClick={async () => {
            const { error } = await supabase.auth.resend({ type: 'signup', email });
            if (error) {
              toast.error(error.message);
            } else {
              toast.success('Correo de verificación reenviado.');
            }
          }}
          disabled={loading}
        >
          Re-enviar correo de confirmación
        </Button>
        <Button variant="outline" type="button" onClick={() => router.push('/login')}>Ir a iniciar sesión</Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nombre</Label>
        <Input id="name" value={name} onChange={e=>setName(e.target.value)} className="border-2 border-gray-300 focus:border-brand-blue" required/>
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Teléfono</Label>
        <Input id="phone" value={phone} onChange={e=>setPhone(e.target.value)} className="border-2 border-gray-300 focus:border-brand-blue" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="emailR">Email</Label>
        <Input id="emailR" type="email" value={email} onChange={e=>setEmail(e.target.value)} className="border-2 border-gray-300 focus:border-brand-blue" required/>
      </div>
      <div className="space-y-2">
        <Label htmlFor="pass">Contraseña</Label>
        <Input id="pass" type="password" value={password} onChange={e=>setPassword(e.target.value)} className="border-2 border-gray-300 focus:border-brand-blue" required/>
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin"/>Creando...</> : 'Crear cuenta'}
      </Button>
    </form>
  );
} 