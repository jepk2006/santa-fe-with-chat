'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function TrackOrderPage() {
  const router = useRouter();
  const [orderId, setOrderId] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Function to handle and format the order ID input
  const handleOrderIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow alphanumeric characters but format them
    let value = e.target.value.replace(/[^a-zA-Z0-9-]/g, '');
    
    // Convert to uppercase for better readability
    value = value.toUpperCase();
    
    // Limit to reasonable length
    if (value.length > 20) {
      value = value.substring(0, 20);
    }
    
    setOrderId(value);
  };

  // Function to format phone numbers as (X) XXX-XXXX (same as checkout-dialog.tsx)
  const formatPhoneNumber = (value: string) => {
    // Allow empty input by returning empty string
    if (!value) return '';
    
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, '');
    
    // If there are no digits left, return empty string
    if (digits.length === 0) return '';
    
    // Format phone number based on length with pattern (X) XXX-XXXX
    if (digits.length === 1) {
      return `(${digits})`;
    } else if (digits.length <= 4) {
      return `(${digits.charAt(0)}) ${digits.substring(1)}`;
    } else if (digits.length <= 8) {
      return `(${digits.charAt(0)}) ${digits.substring(1, 4)}-${digits.substring(4)}`;
    } else {
      // If too many digits, truncate at 8
      return `(${digits.charAt(0)}) ${digits.substring(1, 4)}-${digits.substring(4, 8)}`;
    }
  };

  // Function to handle and format the phone number input
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    if (!inputValue) {
      setPhoneNumber('');
      return;
    }
    
    const formattedValue = formatPhoneNumber(inputValue);
    setPhoneNumber(formattedValue);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Basic validation
    if (!orderId.trim()) {
      setError('Por favor ingrese el número de pedido');
      return;
    }
    
    if (!phoneNumber.trim()) {
      setError('Por favor ingrese el número de teléfono usado para el pedido');
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Call an API endpoint to validate the combination of order ID and phone
      const response = await fetch('/api/verify-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: orderId.trim(),
          phoneNumber: phoneNumber.trim(),
        }),
      });
      
      // Parse the JSON response safely
      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        setError('Error al leer la respuesta del servidor. Por favor intente nuevamente.');
        return;
      }
      
      if (!response.ok) {
        // Handle not found case gracefully
        if (response.status === 404) {
          setError('No se encontró ningún pedido con esa combinación de número de pedido y teléfono. Por favor verifique la información ingresada.');
        } else {
          setError(data?.message || 'Error al verificar el pedido. Por favor intente nuevamente.');
        }
        return;
      }
      
      if (data && data.verified) {
        // If verified, redirect to the order details page
        router.push(`/order-details/${data.orderId}?phone=${encodeURIComponent(phoneNumber.trim())}`);
      } else {
        setError('No se encontró ningún pedido con esa combinación de número de pedido y teléfono. Por favor verifique la información ingresada.');
      }
    } catch (err) {
      // Set a generic error message
      setError('Error al procesar la solicitud. Por favor intente nuevamente en unos momentos.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container max-w-md py-10">
      <Card className="border-none shadow-sm">
        <CardHeader className="space-y-1 text-center pb-2">
          <CardTitle className="text-2xl font-bold">Seguimiento de Pedido</CardTitle>
          <CardDescription>
            Consulte el estado de su compra fácilmente
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>Información no encontrada</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="orderId" className="text-base">Número de Pedido</Label>
              <div className="relative">
                <Input
                  id="orderId"
                  className="pl-10 py-6 text-lg"
                  placeholder="ORD-12345678"
                  value={orderId}
                  onChange={handleOrderIdChange}
                  disabled={isLoading}
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <Search className="h-5 w-5" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Ingrese el número de pedido en formato "ORD-" seguido de los dígitos. Por ejemplo: ORD-12345678
              </p>
            </div>
            
            <div className="space-y-3">
              <Label htmlFor="phoneNumber" className="text-base">Número de Teléfono</Label>
              <Input
                id="phoneNumber"
                type="tel"
                className="py-6 text-lg"
                placeholder="(7) 123-4567"
                value={phoneNumber}
                onChange={handlePhoneChange}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground mt-1">
                El número de teléfono que proporcionó al realizar su compra. Por ejemplo: (7) 123-4567
              </p>
            </div>
            
            <Button type="submit" className="w-full py-6 text-base" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Verificando...
                </>
              ) : (
                'Buscar Mi Pedido'
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center text-sm text-muted-foreground pt-0">
          Si no recuerda la información de su pedido, contacte a nuestro servicio al cliente.
        </CardFooter>
      </Card>
    </div>
  );
} 