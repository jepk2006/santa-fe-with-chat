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
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
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
            Password Setup Process
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            A password setup link will be automatically sent to the user's email.
            They will need to click on this link to set their own password.
          </p>
        </div>
        
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" className="border-2 border-gray-300 focus:border-blue-500" {...field} />
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
              <FormLabel>Email</FormLabel>
              <FormDescription>
                An invitation email will be sent to this address.
              </FormDescription>
              <FormControl>
                <Input type="email" placeholder="john@example.com" className="border-2 border-gray-300 focus:border-blue-500" {...field} />
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
              <FormLabel>Phone Number</FormLabel>
              <FormDescription>
                Optional phone number for the user.
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
              <FormLabel>Role</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger className="border-2 border-gray-300 focus:border-blue-500">
                    <SelectValue placeholder="Select a role" />
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

        {(showPasswordOption || debugInfo) && (
          <Alert variant="warning" className="bg-amber-50 border-amber-200">
            <AlertCircle className="h-4 w-4 text-amber-800" />
            <AlertTitle className="text-amber-800">Alternative Method</AlertTitle>
            <AlertDescription className="text-amber-700">
              If the email invitation isn't working, you can set a temporary password directly.
              <div className="mt-2 space-y-4">
                <div className="flex items-start space-x-2">
                  <Checkbox 
                    id="use-password" 
                    checked={usePassword}
                    onCheckedChange={(checked) => {
                      setUsePassword(checked === true);
                    }}
                  />
                  <label 
                    htmlFor="use-password" 
                    className="text-sm cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Set password directly instead of sending invitation
                  </label>
                </div>
                {usePassword && (
                  <div>
                    <Input
                      type="password"
                      placeholder="Temporary password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="mt-2 border-2 border-gray-300 focus:border-blue-500"
                    />
                    <p className="text-xs mt-1 text-amber-600">
                      Password must be at least 6 characters. The user can change it later.
                    </p>
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {debugInfo && (
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-md">
            <h4 className="font-medium text-amber-800 mb-1">Debug Information</h4>
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
              Creating User...
            </>
          ) : (
            usePassword ? 'Create User with Password' : 'Create & Send Invitation'
          )}
        </Button>
      </form>
    </Form>
  );
} 