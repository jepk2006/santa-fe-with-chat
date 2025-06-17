'use client';

import { Product } from '@/types';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useCart } from '@/hooks/use-cart';
import { useState } from 'react';
import { toast } from 'sonner';
import ProductImages from '@/components/shared/product/product-images';
import { useRouter } from 'next/navigation';

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
  
  const [weight, setWeight] = useState(Number(minWeight) || 1);
  
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

            {/* Stock Status */}
            <div className="mt-2 flex items-center space-x-2">
              <span className={`font-medium ${product.inStock ? "text-green-600" : "text-red-300"}`}>
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
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <Input
                          id="weight"
                          type="number"
                          min={Number(minWeight) || 0.1}
                          step={0.1}
                          value={isNaN(weight) ? '' : weight}
                          onChange={(e) => {
                            const newWeight = parseFloat(e.target.value);
                            setWeight(isNaN(newWeight) ? 0 : newWeight);
                          }}
                          onBlur={(e) => {
                            if (!e.target.value || isNaN(parseFloat(e.target.value))) {
                              setWeight(Number(minWeight) || 1);
                            }
                          }}
                          className="w-24 border border-gray-300 bg-white"
                        />
                        <span className="text-sm font-medium text-gray-700">{weightUnit}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Total: {isNaN(weight) ? "-" : formatPrice(product.price * weight)}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Label htmlFor="quantity">Quantity</Label>
                    <div className="flex items-center justify-center space-x-4 p-3 bg-white border border-gray-300 rounded-lg w-fit">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="h-8 w-8 bg-white border-gray-300 hover:bg-gray-100"
                      >
                        -
                      </Button>
                      <span className="text-lg font-semibold text-gray-900 min-w-[2rem] text-center">{quantity}</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setQuantity(quantity + 1)}
                        className="h-8 w-8 bg-white border-gray-300 hover:bg-gray-100"
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


    </div>
  );
} 