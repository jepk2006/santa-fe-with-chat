'use client';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { PhoneInput } from '@/components/ui/phone-input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { createUser, createUserSimple } from '@/lib/actions/user.actions';
import { createUserSchema } from '@/lib/validators';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Mail, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";

const USER_ROLES = ['admin', 'ventas'] as const;

export default function CreateUserForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  const [showPasswordOption, setShowPasswordOption] = useState(false);
  const [usePassword, setUsePassword] = useState(false);
  const [password, setPassword] = useState('');

  const form = useForm<z.infer<typeof createUserSchema>>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      name: '',
      email: '',
      phone_number: '',
      role: 'admin' as 'admin' | 'ventas',
    },
  });

  const onSubmit = async (values: z.infer<typeof createUserSchema>) => {
    setIsLoading(true);
    setDebugInfo(null);
    
    try {

      
      let res;
      if (usePassword && password) {
        // Use the simple method with direct password
        res = await createUserSimple({
          name: values.name,
          email: values.email,
          phone_number: values.phone_number || '',
          role: values.role as 'admin' | 'user',
          password: password,
        });
      } else {
        // Use the email invitation method
        res = await createUser({
          name: values.name,
          email: values.email,
          phone_number: values.phone_number || '',
          role: values.role as 'admin' | 'user',
        });
      }



      if (!res.success) {
        setDebugInfo(res.message || "Unknown error");
        toast({
          variant: 'destructive',
          description: res.message,
        });
        setIsLoading(false);
        
        // Show password option if email method fails
        if (!showPasswordOption) {
          setShowPasswordOption(true);
        }
        return;
      }

      toast({
        description: res.message || 'User created successfully',
      });
      
      // Wait a moment to show the success message before redirecting
      setTimeout(() => {
        router.push('/admin/users');
        router.refresh();
      }, 1000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error desconocido';
      setDebugInfo(errorMessage);
      
      // Show password option if email method fails
      if (!showPasswordOption) {
        setShowPasswordOption(true);
      }
      
      toast({
        variant: 'destructive',
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-muted/50 p-4 rounded-lg border mb-6">
          <h3 className="font-medium flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Proceso de Configuración de Contraseña
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Se enviará automáticamente un enlace de configuración de contraseña al correo del usuario.
            Necesitarán hacer clic en este enlace para establecer su propia contraseña.
          </p>
        </div>
        
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre</FormLabel>
              <FormControl>
                <Input placeholder="Juan Pérez" className="border-2 border-gray-300 focus:border-blue-500" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Correo Electrónico</FormLabel>
              <FormDescription>
                Se enviará un correo de invitación a esta dirección.
              </FormDescription>
              <FormControl>
                <Input type="email" placeholder="juan@ejemplo.com" className="border-2 border-gray-300 focus:border-blue-500" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Número de Teléfono</FormLabel>
              <FormDescription>
                Número de teléfono opcional para el usuario.
              </FormDescription>
              <FormControl>
                <PhoneInput 
                  className="border-2 border-gray-300 focus:border-blue-500" 
                  value={field.value}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Rol</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger className="border-2 border-gray-300 focus:border-blue-500">
                    <SelectValue placeholder="Selecciona un rol" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {USER_ROLES.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {showPasswordOption && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Opción de Contraseña Manual</AlertTitle>
            <AlertDescription>
              El método de invitación por correo falló. Puedes crear el usuario con una contraseña manual en su lugar.
            </AlertDescription>
          </Alert>
        )}

        {showPasswordOption && (
          <div className="space-y-4 p-4 border rounded-lg bg-yellow-50">
            <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="usePassword" 
                    checked={usePassword}
                    onCheckedChange={(checked) => setUsePassword(checked === true)}
                  />
              <label htmlFor="usePassword" className="text-sm font-medium">
                Usar contraseña manual en lugar de invitación por correo
                  </label>
                </div>
            
                {usePassword && (
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contraseña</FormLabel>
                    <FormDescription>
                      Mínimo 6 caracteres. El usuario puede cambiar esto más tarde.
                    </FormDescription>
                    <FormControl>
                    <Input
                      type="password"
                        placeholder="••••••••" 
                        className="border-2 border-gray-300 focus:border-blue-500"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
                )}
              </div>
        )}

        {debugInfo && (
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-md">
            <h4 className="font-medium text-amber-800 mb-1">Información de Depuración</h4>
            <pre className="text-xs overflow-auto whitespace-pre-wrap text-amber-700">
              {debugInfo}
            </pre>
          </div>
        )}

        <Button 
          type="submit" 
          disabled={isLoading || (usePassword && password.length < 6)}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creando Usuario...
            </>
          ) : (
            usePassword ? 'Crear Usuario con Contraseña' : 'Crear y Enviar Invitación'
          )}
        </Button>
      </form>
    </Form>
  );
} 