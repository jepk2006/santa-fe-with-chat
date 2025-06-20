'use client';

import { ProductForm, ProductGeneralInfo, ProductImages } from './product-form';
import { ProductInventoryForm, InventoryFormHandle } from './product-inventory-form';
import { Button } from '@/components/ui/button';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateProductSchema } from '@/lib/validators';
import { useCallback, useRef } from 'react';
import { useDebounceCallback } from '@/hooks/use-debounce';
import { updateProduct } from '@/lib/actions/product.actions';
import { useToast } from '@/hooks/use-toast';
import { Form } from '@/components/ui/form';
import { useRouter } from 'next/navigation';

interface ProductEditFormProps {
  product: {
    id: string;
    name: string;
    slug: string;
    description: string;
    price: number;
    inStock: boolean;
    isFeatured: boolean;
    images: string[];
    category: string;
    brand: string;
    banner: string | null;
    selling_method?: string;
    sellingMethod?: string;
  };
  initialInventory: any[];
}

export function ProductEditForm({ product, initialInventory }: ProductEditFormProps) {
  const { toast } = useToast();
  const form = useForm({
    resolver: zodResolver(updateProductSchema),
    defaultValues: {
      name: product.name,
      slug: product.slug,
      description: product.description,
      price: product.price,
      selling_method: (product as any).selling_method || (product as any).sellingMethod || 'unit',
      in_stock: product.inStock,
      is_featured: product.isFeatured,
      images: product.images,
      category: product.category,
      brand: product.brand,
      banner: product.banner,
    },
  });

  const saveChanges = useCallback(async (data: any) => {
    try {
      const formData = {
        ...data,
        price: Number(data.price) || 0,
      };

      const response = await updateProduct({
        id: product.id,
        ...formData,
      });

      if (!response.success) {
        toast({
          variant: 'destructive',
          description: response.message || 'Failed to update product',
        });
        return;
      }

      toast({
        description: 'Changes saved',
        duration: 2000,
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        description: 'An error occurred while saving changes',
      });
    }
  }, [product.id, toast]);

  const debouncedSave = useDebounceCallback(saveChanges, 1000);

  // Ref to access inventory save
  const inventoryRef = useRef<InventoryFormHandle>(null);
  const router = useRouter();

  const handleFieldChange = useCallback(() => {
    const data = form.getValues();
    debouncedSave(data);
  }, [form, debouncedSave]);

  // Watch selling method to conditionally show inventory section
  const sellingMethod = form.watch('selling_method');

  // Helper function to check if product uses weight
  const requiresInventoryManagement = (method: string) => method === 'weight_fixed';

  return (
    <Form {...form}>
      <form className="space-y-8">
        {/* General Info Section */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Información General</h3>
          <ProductGeneralInfo form={form} onFieldChange={handleFieldChange} />
        </div>

        {/* Location Availability Section - Only show for weight_fixed products */}
        {requiresInventoryManagement(sellingMethod) && (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Disponibilidad por ubicación</h3>
            <p className="text-sm text-gray-500">
              Agrega unidades con pesos específicos para cada sucursal. Cada unidad tendrá un peso y precio fijo.
            </p>
            <ProductInventoryForm 
              ref={inventoryRef}
              productId={product.id}
              pricePerKg={product.price}
              initialInventory={initialInventory}
              showButton={false}
              sellingMethod={sellingMethod}
            />
          </div>
        )}

        {/* Images Section */}
        <ProductImages form={form} onFieldChange={handleFieldChange} />

        {/* Combined Save & Exit Button */}
        <Button 
          type="button" 
          onClick={async () => {
            const data = form.getValues();
            // Save product changes
            await saveChanges(data);
            // Save inventory changes
            if (inventoryRef.current && requiresInventoryManagement(sellingMethod)) {
              await inventoryRef.current.saveInventory();
            }

            // Navigate back to products list
            router.push('/admin/products');
          }}
          className="w-full"
        >
          Guardar y salir
        </Button>
      </form>
    </Form>
  );
} 