'use client';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
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
import { updateUser } from '@/lib/actions/user.actions';
import { updateUserSchema } from '@/lib/validators';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { ControllerRenderProps, useForm } from 'react-hook-form';
import { z } from 'zod';

const USER_ROLES = ['admin', 'ventas'] as const;

const UpdateUserForm = ({
  user,
}: {
  user: z.infer<typeof updateUserSchema>;
}) => {
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof updateUserSchema>>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      id: user.id,
      name: user.name || '',
      email: user.email || '',
      phone_number: user.phone_number || '',
      role: user.role || 'ventas',
    },
  });

  const onSubmit = async (values: z.infer<typeof updateUserSchema>) => {
    try {
      const res = await updateUser({
        id: user.id,
        name: values.name,
        email: values.email,
        phone_number: values.phone_number,
        role: values.role,
      });

      if (!res.success) {
        return toast({
          variant: 'destructive',
          description: res.message,
        });
      }

      toast({
        description: 'User updated successfully',
      });
      
      // Wait a moment to show the success message before redirecting
      setTimeout(() => {
      router.push('/admin/users');
      }, 1000);
    } catch (error) {
      toast({
        variant: 'destructive',
        description: (error as Error).message,
      });
    }
  };

  return (
    <Form {...form}>
      <form method='POST' onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
        {/* Email */}
          <FormField
            control={form.control}
            name='email'
            render={({
              field,
            }: {
              field: ControllerRenderProps<
                z.infer<typeof updateUserSchema>,
                'email'
              >;
            }) => (
            <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    disabled={true}
                    placeholder='Enter user email'
                    className="border-2 border-gray-300"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

        {/* Name */}
          <FormField
            control={form.control}
            name='name'
            render={({
              field,
            }: {
              field: ControllerRenderProps<
                z.infer<typeof updateUserSchema>,
                'name'
              >;
            }) => (
            <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder='Enter user name' className="border-2 border-gray-300 focus:border-blue-500" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

        {/* Phone Number */}
          <FormField
            control={form.control}
            name='phone_number'
            render={({
              field,
            }: {
              field: ControllerRenderProps<
                z.infer<typeof updateUserSchema>,
                'phone_number'
              >;
            }) => (
            <FormItem>
                <FormLabel>Número de Teléfono</FormLabel>
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

        {/* Role */}
          <FormField
            control={form.control}
            name='role'
            render={({
              field,
            }: {
              field: ControllerRenderProps<
                z.infer<typeof updateUserSchema>,
                'role'
              >;
            }) => (
            <FormItem>
                <FormLabel>Rol</FormLabel>
                <Select
                  onValueChange={field.onChange}
                defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="border-2 border-gray-300 focus:border-blue-500">
                      <SelectValue placeholder='Selecciona un rol' />
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

        <Button type='submit' className='w-full'>
          Actualizar Usuario
          </Button>
      </form>
    </Form>
  );
};

export default UpdateUserForm;
