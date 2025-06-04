'use client';

import { useToast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { SubmitHandler, useForm, FieldValues } from 'react-hook-form';
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
import { useState, useEffect, useTransition } from 'react';
import { X, Loader2, PlusCircle, AlertCircle } from 'lucide-react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../ui/select';
import { Alert, AlertTitle, AlertDescription } from '../ui/alert';
import { UploadAdapter } from '../ui/upload-adapter';
import { insertProductSchema, updateProductSchema, WEIGHT_UNITS } from '@/lib/validators';

interface ProductFormProps {
  type: 'Create' | 'Update';
  product?: {
    id: string;
    name: string;
    slug: string;
    description: string;
    price: number;
    inStock: boolean;
    rating: number;
    numReviews: number;
    isFeatured: boolean;
    images: string[];
    category: string;
    brand: string;
    banner: string | null;
    sellingMethod: string;
    weightUnit: string | null;
    minWeight: number | null;
  };
  productId?: string;
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

export function ProductForm({ type, product, productId }: ProductFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [showCustomBrand, setShowCustomBrand] = useState(false);

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
        console.error("Error fetching categories or brands:", error);
        toast({
          variant: 'destructive',
          description: 'Failed to load categories and brands',
        });
      }
    };
    
    fetchData();
  }, [toast]);

  // Helper function to ensure value is a valid selling method
  function ensureValidSellingMethod(value: unknown): "unit" | "weight" {
    return value === "weight" ? "weight" : "unit";
  }
  
  // Helper function to ensure value is a valid weight unit
  function ensureValidWeightUnit(value: unknown): "kg" | "g" | "lb" | "oz" | null {
    if (value === "kg" || value === "g" || value === "lb" || value === "oz") {
      return value;
    }
    return null;
  }

  const form = useForm<FormData>({
    resolver: zodResolver(type === 'Create' ? insertProductSchema : updateProductSchema),
    defaultValues: {
      name: product?.name || '',
      slug: product?.slug || '',
      description: product?.description || '',
      price: product?.price || 0,
      in_stock: product?.inStock ?? true,
      rating: product?.rating || 0,
      num_reviews: product?.numReviews || 0,
      is_featured: product?.isFeatured || false,
      images: product?.images || [],
      category: product?.category || '',
      brand: product?.brand || (type === 'Create' ? 'Frigorifico Santa Fe' : ''),
      banner: product?.banner || null,
      selling_method: ensureValidSellingMethod(product?.sellingMethod),
      weight_unit: ensureValidWeightUnit(product?.weightUnit),
      min_weight: product?.minWeight || null,
    },
  }) as any;

  // Determine if we should show custom inputs when product has values not in the lists
  useEffect(() => {
    if (product?.category && categories.length > 0) {
      const categoryExists = categories.some(c => c.category === product.category);
      setShowCustomCategory(!categoryExists);
    }
    
    if (product?.brand && brands.length > 0) {
      const brandExists = brands.some(b => b.brand === product.brand);
      setShowCustomBrand(!brandExists);
    }
  }, [product?.category, product?.brand, categories, brands]);

  // Watch the name field and update slug when it changes
  const name = form.watch('name');
  useEffect(() => {
    if (name) {
      form.setValue('slug', slugify(name, { lower: true }));
    }
  }, [name, form]);

  const onSubmit: SubmitHandler<FormData> = async (values) => {
    setIsLoading(true);
    
    startTransition(async () => {
      try {
        // Parse numeric values
        const formData = {
          ...values,
          price: Number(values.price) || 0,
          rating: Number(values.rating) || 0,
          num_reviews: Number(values.num_reviews) || 0,
        };

        if (product) {
          // Update existing product
          const response = await updateProduct({
            id: product.id,
            ...formData,
            selling_method: formData.selling_method,
            weight_unit: formData.selling_method === 'weight' ? formData.weight_unit : null,
            min_weight: formData.selling_method === 'weight' ? formData.min_weight : null,
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
            price: formData.price,
            inStock: formData.in_stock,
            rating: formData.rating,
            numReviews: formData.num_reviews,
            name: formData.name,
            slug: formData.slug,
            description: formData.description,
            isFeatured: formData.is_featured,
            images: formData.images,
            category: formData.category,
            brand: formData.brand,
            banner: formData.banner || null,
            selling_method: formData.selling_method,
            weight_unit: formData.selling_method === 'weight' ? formData.weight_unit : null,
            min_weight: formData.selling_method === 'weight' ? formData.min_weight : null,
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

  const images = form.watch('images');
  const isFeatured = form.watch('is_featured');
  const banner = form.watch('banner');
  const sellingMethod = form.watch('selling_method');
  const weightUnit = form.watch('weight_unit');

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="Product name" {...field} />
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
                  <Input placeholder="product-slug" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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
                    placeholder="0.00" 
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    value={field.value}
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
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>In Stock</FormLabel>
                  <FormDescription>
                    Is this product currently available for purchase?
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <div className="space-y-2">
                  {!showCustomCategory ? (
                    <div className="flex flex-row space-x-2">
                      <div className="flex-grow">
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem 
                                key={category.category} 
                                value={category.category}
                              >
                                {category.category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowCustomCategory(true);
                          form.setValue('category', '');
                        }}
                      >
                        <PlusCircle className="h-4 w-4 mr-2" />
                        New
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-row space-x-2">
                      <div className="flex-grow">
                        <FormControl>
                          <Input placeholder="New category" {...field} />
                        </FormControl>
                      </div>
                      {categories.length > 0 && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowCustomCategory(false)}
                        >
                          Use Existing
                        </Button>
                      )}
                    </div>
                  )}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="brand"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Brand</FormLabel>
                <div className="space-y-2">
                  {!showCustomBrand ? (
                    <div className="flex flex-row space-x-2">
                      <div className="flex-grow">
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a brand" />
                          </SelectTrigger>
                          <SelectContent>
                            {brands.map((brand) => (
                              <SelectItem 
                                key={brand.brand} 
                                value={brand.brand}
                              >
                                {brand.brand}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowCustomBrand(true);
                          form.setValue('brand', '');
                        }}
                      >
                        <PlusCircle className="h-4 w-4 mr-2" />
                        New
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-row space-x-2">
                      <div className="flex-grow">
                        <FormControl>
                          <Input placeholder="New brand" {...field} />
                        </FormControl>
                      </div>
                      {brands.length > 0 && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowCustomBrand(false)}
                        >
                          Use Existing
                        </Button>
                      )}
                    </div>
                  )}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="rating"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rating</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="0.1" 
                    min="0" 
                    max="5" 
                    placeholder="0.0" 
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    value={field.value}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="num_reviews"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Number of Reviews</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min="0" 
                    placeholder="0" 
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    value={field.value}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="is_featured"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Featured Product</FormLabel>
                  <FormDescription>
                    This product will appear on the homepage
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="selling_method"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Selling Method</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select selling method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unit">By Unit</SelectItem>
                    <SelectItem value="weight">By Weight</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  How this product is sold - by unit or by weight
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {sellingMethod === 'weight' && (
            <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-md bg-muted/10">
              <FormField
                control={form.control}
                name="weight_unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Weight Unit</FormLabel>
                    <Select
                      value={field.value || ''}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select weight unit" />
                      </SelectTrigger>
                      <SelectContent>
                        {WEIGHT_UNITS.map(unit => (
                          <SelectItem key={unit} value={unit}>
                            {unit === 'kg' ? 'Kilogram (kg)' : 
                             unit === 'g' ? 'Gram (g)' : 
                             unit === 'lb' ? 'Pound (lb)' : 
                             'Ounce (oz)'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="min_weight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minimum Weight</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        min="0" 
                        placeholder="0.00" 
                        value={field.value === null ? '' : field.value}
                        onChange={(e) => field.onChange(e.target.value === '' ? null : parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      Minimum amount that can be purchased (leave empty for no minimum)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="col-span-1 md:col-span-2">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Weight-based product</AlertTitle>
                  <AlertDescription>
                    The price specified above is per {weightUnit || '(select unit)'}. Customers will select the weight they want to purchase.
                  </AlertDescription>
                </Alert>
              </div>
            </div>
          )}
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Product description"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="images"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Product Images</FormLabel>
              <FormDescription>
                Upload clear, high-quality images that showcase your product.
              </FormDescription>
              <FormControl>
                <div className="space-y-4">
                  <UploadAdapter
                    isMultiple={true}
                    maxFiles={10}
                    value={field.value}
                    onUploadComplete={(urls) => {
                      field.onChange([...images, ...urls]);
                    }}
                    imageType="product"
                    label="Upload Product Images"
                    helpText="Recommended size: 1000×1000. JPG, PNG, WebP (up to 4MB)"
                  />
                  
                  {images && images.length > 0 && (
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="text-sm font-medium">Product Images ({images.length})</h3>
                        {images.length > 0 && (
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm"
                            onClick={() => field.onChange([])}
                          >
                            <X className="h-4 w-4 mr-1" /> Remove All
                          </Button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {images.map((image: string, index: number) => (
                          <div key={index} className="relative group border rounded-lg overflow-hidden">
                            <div className="aspect-square relative">
                              <Image
                                src={image}
                                alt={`Product image ${index + 1}`}
                                fill
                                className="object-cover"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors">
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="icon"
                                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => {
                                    const newImages = images.filter((_: string, i: number) => i !== index);
                                    field.onChange(newImages);
                                    toast({
                                      description: "Image removed",
                                    });
                                  }}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
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
                <FormLabel>Banner Image</FormLabel>
                <FormDescription>
                  This image will be displayed in the featured products carousel on the homepage.
                </FormDescription>
                <FormControl>
                  <div className="space-y-4">
                    <UploadAdapter
                      maxFiles={1}
                      value={field.value ? [field.value] : []}
                      onUploadComplete={(urls) => {
                        if (urls && urls.length > 0) {
                          field.onChange(urls[0]);
                        }
                      }}
                      imageType="banner"
                      label="Upload Banner Image"
                      helpText="Recommended size: 1200×400. JPG, PNG, WebP (up to 4MB)"
                    />
                    
                    {banner && (
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="text-sm font-medium">Banner Image Preview</h3>
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              field.onChange(null);
                              toast({
                                description: "Banner image removed",
                              });
                            }}
                          >
                            <X className="h-4 w-4 mr-1" /> Remove
                          </Button>
                        </div>
                        <div className="relative group border rounded-lg overflow-hidden">
                          <div className="aspect-[3/1] relative">
                            <Image
                              src={banner}
                              alt="Banner image"
                              fill
                              className="object-cover object-center"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <Button type="submit" disabled={isLoading || isPending}>
          {(isLoading || isPending) ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {type === 'Create' ? 'Creating...' : 'Updating...'}
            </>
          ) : (
            type === 'Create' ? 'Create Product' : 'Update Product'
          )}
        </Button>
      </form>
    </Form>
  );
}
