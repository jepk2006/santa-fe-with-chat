'use client';

import { Button } from '@/components/ui/button';
import { createDirectOrder } from '@/lib/actions/order.actions';
import { useState } from 'react';

export function OrderDebug() {
  const [output, setOutput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleTestOrder = async () => {
    setIsLoading(true);
    setOutput('Testing order creation...');

    try {
      // Create a simple test order
      const testItems = [
        {
          id: '123e4567-e89b-12d3-a456-426614174000', // Replace with a real product ID from your DB
          name: 'Test Product',
          quantity: 1,
          price: 99.99,
          image: '/placeholder.png',
          selling_method: 'unit',
        }
      ];

      const testOrder = await createDirectOrder(
        testItems, 
        99.99, 
        {
          fullName: 'Test User',
          phoneNumber: '(7) 123-4567',
          city: 'Santa Cruz'
        }
      );

      setOutput(`
Success! Order created with ID: ${testOrder.id}
Created at: ${new Date(testOrder.created_at).toLocaleString()}
User ID: ${testOrder.user_id}
Status: ${testOrder.status}
Total: ${testOrder.total_price}
      `);
    } catch (error) {
      setOutput(`Error creating test order: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const checkOrdersTable = async () => {
    setIsLoading(true);
    setOutput('Checking orders table structure...');

    try {
      // We can't directly access the database from the client
      // This would need to be a server action that returns table info
      setOutput('To check your database structure, run this SQL in your Supabase SQL Editor:\n\n' +
        'SELECT column_name, data_type\n' +
        'FROM information_schema.columns\n' + 
        'WHERE table_name = \'orders\';\n\n' +
        'Then run the migration SQL script to fix any missing columns.');
    } catch (error) {
      setOutput(`Error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg mt-8">
      <h2 className="text-xl font-bold mb-4">Order System Debug</h2>
      
      <div className="flex space-x-4 mb-4">
        <Button 
          onClick={handleTestOrder} 
          disabled={isLoading}
        >
          {isLoading ? 'Processing...' : 'Test Create Order'}
        </Button>
        
        <Button 
          variant="outline" 
          onClick={checkOrdersTable}
          disabled={isLoading}
        >
          Check Orders Table
        </Button>
      </div>
      
      <div className="bg-slate-100 p-4 rounded-md min-h-[100px] font-mono text-sm whitespace-pre-wrap">
        {output || 'Output will appear here...'}
      </div>
    </div>
  );
} 