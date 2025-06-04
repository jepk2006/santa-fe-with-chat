'use client';

import { Product } from '@/types';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useCart } from '@/hooks/use-cart';
import { useState } from 'react';
import { toast } from 'sonner';
import ProductImages from '@/components/shared/product/product-images';
import { useRouter } from 'next/navigation';
import ReviewList from './review-list';
import Rating from '@/components/shared/product/rating';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Scale, Package } from 'lucide-react';

interface ProductDetailsProps {
  product: Product;
  user: any;
}

export default function ProductDetails({ product, user }: ProductDetailsProps) {
  const router = useRouter();
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  
  // Support both camelCase and snake_case property access for compatibility
  // First try the camelCase version, then fall back to snake_case
  const sellingMethod = product.sellingMethod || product.selling_method;
  const weightUnit = product.weightUnit || product.weight_unit;
  const minWeight = product.minWeight || product.min_weight;
  const isWeightBased = sellingMethod === 'weight';
  
  const [weight, setWeight] = useState(minWeight || 1);
  
  const handleAddToCart = () => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.images[0],
      quantity: isWeightBased ? 1 : quantity,
      selling_method: sellingMethod as 'unit' | 'weight', // Use snake_case for compatibility with cart
      weight_unit: weightUnit || undefined,
      weight: isWeightBased ? weight : undefined,
    });
    const description = isWeightBased
      ? `${weight} ${weightUnit} of ${product.name} added to your cart`
      : `${quantity} ${quantity === 1 ? 'item' : 'items'} added to your cart`;
    
    toast.success('Added to cart', {
      description,
      action: {
        label: 'View Cart',
        onClick: () => router.push('/cart'),
      },
    });
  };

  console.log('Product details:', { 
    sellingMethod, 
    weightUnit, 
    minWeight,
    // Debug info - using correct property names
    originalProps: {
      sellingMethod, // local variable
      selling_method: product.selling_method // correct property from API
    }
  });

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Product Images */}
        <div className="space-y-4">
          <ProductImages images={product.images} />
        </div>

        {/* Product Details */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">{product.name}</h1>
            <div className="flex items-center mt-2">
              <p className="text-2xl font-semibold">{formatPrice(product.price)}</p>
              {isWeightBased && weightUnit && (
                <span className="text-sm text-muted-foreground ml-1">
                  /{weightUnit}
                </span>
              )}
            </div>
            <div className="mt-2">
              <Rating value={Number(product.rating)} />
            </div>
            {/* Stock Status */}
            <div className="mt-2 flex items-center space-x-2">
              <span className={`font-medium ${product.inStock ? "text-green-600" : "text-red-600"}`}>
                {product.inStock ? "In Stock" : "Out of Stock"}
              </span>
              <span className="text-muted-foreground">•</span>
              <span className="flex items-center text-sm text-muted-foreground">
                {isWeightBased ? (
                  <>
                    <Scale className="h-4 w-4 mr-1" />
                    <span>Sold by weight</span>
                  </>
                ) : (
                  <>
                    <Package className="h-4 w-4 mr-1" />
                    <span>Sold by unit</span>
                  </>
                )}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-gray-600">{product.description}</p>
            
            {product.inStock ? (
              <>
                {isWeightBased ? (
                  <div className="space-y-3">
                    <Label htmlFor="weight">Select Weight ({weightUnit})</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="weight"
                        type="number"
                        min={minWeight || 0.1}
                        step={0.1}
                        value={weight}
                        onChange={(e) => setWeight(parseFloat(e.target.value))}
                        onBlur={(e) => {
                          if (!e.target.value || isNaN(parseFloat(e.target.value))) {
                            setWeight(1);
                          }
                        }}
                        className="w-24"
                      />
                      <span>{weightUnit}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Total: {isNaN(weight) ? "-" : formatPrice(product.price * weight)}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Label htmlFor="quantity">Quantity</Label>
                    <div className="flex items-center space-x-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      >
                        -
                      </Button>
                      <span>{quantity}</span>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setQuantity(quantity + 1)}
                      >
                        +
                      </Button>
                    </div>
                  </div>
                )}

                <Button
                  className="w-full"
                  onClick={handleAddToCart}
                >
                  Add to Cart
                </Button>
              </>
            ) : (
              <Button
                className="w-full"
                disabled
              >
                Out of Stock
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6">Customer Reviews</h2>
        <ReviewList
          userId={user?.id}
          productId={product.id}
          productSlug={product.slug}
        />
      </div>
    </div>
  );
} 