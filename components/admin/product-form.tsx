// @ts-nocheck

'use client';

import { useToast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { SubmitHandler, useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '../ui/form';
import slugify from 'slugify';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { createProduct, updateProduct, getAllCategories, getAllBrands } from '@/lib/actions/product.actions';
import Image from 'next/image';
import { Checkbox } from '../ui/checkbox';
import { useState, useEffect, useTransition, useCallback } from 'react';
import { X, Loader2, PlusCircle, AlertCircle, Plus } from 'lucide-react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../ui/select';
import { Alert, AlertTitle, AlertDescription } from '../ui/alert';
// @ts-ignore
import { UploadAdapter } from '../ui/upload-adapter';
import { insertProductSchema, updateProductSchema } from '@/lib/validators';
import { useDebounce } from '@/hooks/use-debounce';

interface ProductFormProps {
  type: 'Create' | 'Update';
  product?: {
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
    sellingMethod?: 'unit' | 'weight';
  };
  productId?: string;
  generalInfo?: React.ReactNode;
  locationAvailability?: React.ReactNode;
  images?: React.ReactNode;
  submitButton?: React.ReactNode;
}

type FormData = z.infer<typeof insertProductSchema>;

interface Category {
  category: string;
  _count: number;
}

interface Brand {
  brand: string;
  _count: number;
}

// General Info Section Component
export function ProductGeneralInfo({ form, onFieldChange }: { form: any; onFieldChange?: (field: string) => void }) {
  // Local state for dropdown options & custom toggles
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [showCustomBrand, setShowCustomBrand] = useState(false);

  // Fetch categories & brands once
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [cats, brs] = await Promise.all([getAllCategories(), getAllBrands()]);
        setCategories(cats);
        setBrands(brs);
      } catch (_err) {
        // ignore errors, keep lists empty
      }
    };
    fetchOptions();
  }, []);

  return (
    <div className="space-y-4">
      {/* Name and Slug row */}
      <div className="grid md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input 
                  {...field} 
                  className="border-2 border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all duration-200"
                  onBlur={() => {
                    field.onBlur();
                    onFieldChange?.('name');
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Slug</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  className="border-2 border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all duration-200"
                  onBlur={() => {
                    field.onBlur();
                    onFieldChange?.('slug');
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Description full width */}
      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Descripción</FormLabel>
            <FormControl>
              <Textarea 
                {...field} 
                className="border-2 border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all duration-200"
                onBlur={() => {
                  field.onBlur();
                  onFieldChange?.('description');
                }}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Price and In Stock row */}
      <div className="grid md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Price</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  {...field}
                  className="border-2 border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all duration-200"
                  value={field.value || ''}
                  onChange={(e) => {
                    const value = e.target.value === '' ? '' : parseFloat(e.target.value);
                    field.onChange(value);
                  }}
                  onBlur={(e) => {
                    if (e.target.value === '' || isNaN(parseFloat(e.target.value))) {
                      field.onChange(0);
                    }
                    field.onBlur();
                    onFieldChange?.('price');
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="in_stock"
          render={({ field }) => (
            <FormItem className="flex flex-col justify-end">
              <div className="flex items-center space-x-3 space-y-0 pt-6">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={(checked) => {
                      field.onChange(checked);
                      onFieldChange?.('in_stock');
                    }}
                    className="border-2 border-gray-200"
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="text-base font-medium">
                    In Stock
                  </FormLabel>
                  <p className="text-sm text-gray-500">
                    Is this product currently available for purchase?
                  </p>
                </div>
              </div>
            </FormItem>
          )}
        />
      </div>

      {/* Category & Brand selectors row */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Category */}
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              {!showCustomCategory ? (
                <div className="flex items-center gap-2">
                  <Select onValueChange={field.onChange} value={field.value || ''}>
                    <SelectTrigger className="flex-1 border-2 border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all duration-200">
                      <SelectValue placeholder="Selecciona categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.category} value={c.category}>{c.category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button type="button" variant="ghost" size="icon" onClick={() => setShowCustomCategory(true)} className="border-2 border-gray-200 hover:border-gray-300">
                    <Plus className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-gray-600">New</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Nueva categoría"
                    value={field.value || ''}
                    onChange={(e) => field.onChange(e.target.value)}
                    className="flex-1 border-2 border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all duration-200"
                  />
                  <Button type="button" variant="ghost" size="icon" onClick={() => setShowCustomCategory(false)} className="border-2 border-gray-200 hover:border-gray-300">✕</Button>
                </div>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Brand */}
        <FormField
          control={form.control}
          name="brand"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Brand</FormLabel>
              {!showCustomBrand ? (
                <div className="flex items-center gap-2">
                  <Select onValueChange={field.onChange} value={field.value || ''}>
                    <SelectTrigger className="flex-1 border-2 border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all duration-200">
                      <SelectValue placeholder="Selecciona marca" />
                    </SelectTrigger>
                    <SelectContent>
                      {brands.map((b) => (
                        <SelectItem key={b.brand} value={b.brand}>{b.brand}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button type="button" variant="ghost" size="icon" onClick={() => setShowCustomBrand(true)} className="border-2 border-gray-200 hover:border-gray-300">
                    <Plus className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-gray-600">New</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Nueva marca"
                    value={field.value || ''}
                    onChange={(e) => field.onChange(e.target.value)}
                    className="flex-1 border-2 border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all duration-200"
                  />
                  <Button type="button" variant="ghost" size="icon" onClick={() => setShowCustomBrand(false)} className="border-2 border-gray-200 hover:border-gray-300">✕</Button>
                </div>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Featured Product and Método de Venta row */}
      <div className="grid md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name="is_featured"
          render={({ field }) => (
            <FormItem className="p-4 border-2 border-gray-200 rounded-lg">
              <div className="flex items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={(checked) => {
                      field.onChange(checked);
                      onFieldChange?.('is_featured');
                    }}
                    className="border-2 border-gray-200 mt-1"
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="text-base font-medium">
                    Featured Product
                  </FormLabel>
                  <p className="text-sm text-gray-500">
                    This product will appear on the homepage
                  </p>
                </div>
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="selling_method"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Método de Venta</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || 'unit'}>
                <SelectTrigger className="border-2 border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all duration-200">
                  <SelectValue placeholder="Selecciona método" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unit">Por Unidad</SelectItem>
                  <SelectItem value="weight_custom">Por Peso (Cliente Elige)</SelectItem>
                  <SelectItem value="weight_fixed">Por Peso (Unidades Fijas)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-500 mt-1">
                Por Unidad: venta tradicional por cantidad. Por Peso (Cliente Elige): como unidad pero precio por peso. Por Peso (Unidades Fijas): requiere configurar unidades específicas por ubicación.
              </p>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}

// Images Section Component
export function ProductImages({ form, onFieldChange }: { form: any; onFieldChange?: (field: string) => void }) {
  const images = form.watch('images');
  const isFeatured = form.watch('is_featured');
  const banner = form.watch('banner');

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xl font-semibold">Imágenes del Producto</h3>
        <p className="text-sm text-gray-500">Agrega imágenes del producto. La primera imagen será la principal.</p>
      </div>

      <div className="space-y-4">
        <FormField
          control={form.control}
          name="images"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <UploadAdapter
                  value={field.value}
                  onChange={(urls) => {
                    field.onChange(urls);
                    onFieldChange?.('images');
                  }}
                  onRemove={(url: string) => {
                    field.onChange(field.value.filter((i: string) => i !== url));
                    onFieldChange?.('images');
                  }}
                  endpoint={'productImage' as any}
                  accept={'image/*' as any}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {isFeatured && (
          <FormField
            control={form.control}
            name="banner"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Imagen de banner</FormLabel>
                <FormControl>
                  <UploadAdapter
                    value={field.value ? [field.value] : []}
                    onChange={(urls) => {
                      field.onChange(urls[0] || null);
                      onFieldChange?.('banner');
                    }}
                    onRemove={() => {
                      field.onChange(null);
                      onFieldChange?.('banner');
                    }}
                    endpoint={'bannerImage' as any}
                    accept={'image/*' as any}
                    maxFiles={1}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
      </div>
    </div>
  );
}

export function ProductForm({ 
  type, 
  product, 
  productId,
  generalInfo,
  locationAvailability,
  images,
  submitButton
}: ProductFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [showCustomBrand, setShowCustomBrand] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  // Fetch categories and brands on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesData, brandsData] = await Promise.all([
          getAllCategories(),
          getAllBrands()
        ]);
        setCategories(categoriesData);
        setBrands(brandsData);
      } catch (error) {
        toast({
          variant: 'destructive',
          description: 'Failed to load categories and brands',
        });
      }
    };
    
    fetchData();
  }, [toast]);

  const form = useForm<FormData>({
    resolver: zodResolver(type === 'Create' ? insertProductSchema : updateProductSchema),
    defaultValues: {
      name: product?.name || '',
      slug: product?.slug || '',
      description: product?.description || '',
      price: product?.price || 0,
      selling_method: (product?.sellingMethod || (product as any)?.selling_method || 'unit') as 'unit' | 'weight',
      in_stock: product?.inStock ?? true,
      is_featured: product?.isFeatured || false,
      images: product?.images || [],
      category: product?.category || '',
      brand: product?.brand || (type === 'Create' ? 'Frigorifico Santa Fe' : ''),
      banner: product?.banner || null,
    },
  });

  // Watch the name field and update slug when it changes
  const name = form.watch('name');
  useEffect(() => {
    if (name) {
      form.setValue('slug', slugify(name, { lower: true }));
    }
  }, [name, form]);

  const saveChanges = useCallback(async (data: FormData) => {
    if (!product?.id) return;

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

      setLastSavedAt(new Date());
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
  }, [product?.id, toast]);

  // Debounced save function
  const debouncedSave = useDebounce(saveChanges, 500);

  // Handle field changes
  const handleFieldChange = useCallback((field: string) => {
    const data = form.getValues();
    debouncedSave(data);
  }, [form, debouncedSave]);

  const onSubmit: SubmitHandler<FormData> = async (values) => {
    setIsLoading(true);
    
    startTransition(async () => {
      try {
        // Parse numeric values
        const formData = {
          ...values,
          price: Number(values.price) || 0,
        };

        if (product) {
          // Update existing product
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
            description: 'Product updated successfully',
          });
          
          // Handle redirect if provided
          if (response.redirect) {
            router.push(response.redirect);
            router.refresh();
          }
        } else {
          // Create new product
          const response = await createProduct({
            ...formData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });

          if (!response.success) {
            toast({
              variant: 'destructive',
              description: response.message || 'Failed to create product',
            });
            return;
          }

          toast({
            description: 'Product created successfully',
          });
          router.push('/admin/products');
          router.refresh();
        }
      } catch (error) {
        toast({
          variant: 'destructive',
          description: 'An error occurred while saving the product',
        });
      } finally {
        setIsLoading(false);
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {generalInfo}
        {locationAvailability}
        {images}
        {submitButton}

        {lastSavedAt && (
          <p className="text-sm text-gray-500 text-right">
            Last saved: {lastSavedAt.toLocaleTimeString()}
          </p>
        )}
      </form>
    </Form>
  );
}
