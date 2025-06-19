'use client';
import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { registerUser } from '@/lib/actions/auth.actions';

interface RegisterFormProps {
  onRegistered?: (isRegistered: boolean) => void;
}

export default function RegisterForm({ onRegistered }: RegisterFormProps) {
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

  useEffect(() => {
    onRegistered?.(registered);
  }, [registered, onRegistered]);

  // Format phone number as user types
  const formatPhoneNumber = (value: string) => {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, '');
    
    // Don't format if empty
    if (!digits) return '';
    
    // Format based on length - ensure we always have complete format
    if (digits.length === 1) {
      return `(${digits}) `;
    } else if (digits.length <= 4) {
      return `(${digits.slice(0, 1)}) ${digits.slice(1)}`;
    } else if (digits.length <= 8) {
      return `(${digits.slice(0, 1)}) ${digits.slice(1, 4)}-${digits.slice(4)}`;
    } else {
      // Limit to 8 digits total
      return `(${digits.slice(0, 1)}) ${digits.slice(1, 4)}-${digits.slice(4, 8)}`;
    }
  };

  // Validate phone number format - must be complete format
  const isValidPhoneFormat = (phone: string) => {
    // Extract digits only and check if we have exactly 8 digits
    const digits = phone.replace(/\D/g, '');
    return digits.length === 8;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhone(formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate phone number format if phone is provided
    if (phone && !isValidPhoneFormat(phone)) {
      toast.error('El teléfono debe tener 8 dígitos en formato (X) XXX-XXXX');
      return;
    }
    
    setLoading(true);
    try {
      // Clear any existing invalid sessions to prevent JWT errors
      await supabase.auth.signOut();
      
      // Convert phone to E.164 format for Supabase (Bolivia country code +591)
      let e164Phone = '';
      if (phone) {
        const digits = phone.replace(/\D/g, '');
        e164Phone = `+591${digits}`;
      }
      
      const registrationData = {
        email,
        password,
        name,
        phone: e164Phone // Send the E.164 formatted phone value
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
        <Input id="name" value={name} onChange={e=>setName(e.target.value)} placeholder="Ej: Juan Pérez" className="border-2 border-gray-300 focus:border-brand-blue" required/>
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Teléfono</Label>
        <Input 
          id="phone" 
          value={phone} 
          onChange={handlePhoneChange}
          placeholder="(7) 123-4567"
          className="border-2 border-gray-300 focus:border-brand-blue" 
          maxLength={14} // Limit input length to formatted string
        />
        <p className="text-xs text-gray-500">Formato: (X) XXX-XXXX</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="emailR">Email</Label>
        <Input id="emailR" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="ejemplo@correo.com" className="border-2 border-gray-300 focus:border-brand-blue" required/>
      </div>
      <div className="space-y-2">
        <Label htmlFor="pass">Contraseña</Label>
        <Input id="pass" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Mínimo 8 caracteres" className="border-2 border-gray-300 focus:border-brand-blue" required/>
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin"/>Creando...</> : 'Crear cuenta'}
      </Button>
    </form>
  );
} 