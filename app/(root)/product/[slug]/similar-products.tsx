'use client';

import { Product } from '@/types';
import ProductCard from '@/components/shared/product/product-card';
import { getSimilarProducts } from '@/lib/actions/product.actions';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface SimilarProductsProps {
  category: string;
  currentProductId: string;
  initialProducts: Product[];
}

export default function SimilarProducts({ 
  category, 
  currentProductId,
  initialProducts
}: SimilarProductsProps) {
  const [visibleProducts, setVisibleProducts] = useState(Math.min(initialProducts.length, 4));
  const [products] = useState(initialProducts);

  if (!products || products.length === 0) {
    return null;
  }

  const displayedProducts = products.slice(0, visibleProducts);

  // For fewer products, ensure they're centered and don't take excessive space
  const getContainerClass = () => {
    if (displayedProducts.length === 1) return "max-w-sm mx-auto";
    if (displayedProducts.length <= 2) return "max-w-2xl mx-auto";
    return "";
  };

  // Determine grid columns based on number of products
  const getGridClass = () => {
    const count = displayedProducts.length;
    if (count === 1) return "grid-cols-1 place-items-center";
    if (count === 2) return "grid-cols-1 sm:grid-cols-2 gap-6";
    if (count === 3) return "grid-cols-1 sm:grid-cols-2 md:grid-cols-3";
    return "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4";
  };

  const showMore = () => {
    // Show 4 more products at a time, up to the maximum
    setVisibleProducts(prev => Math.min(prev + 4, products.length));
  };

  const showLess = () => {
    // Show minimum 4 products
    setVisibleProducts(4);
  };

  return (
    <div className="mt-8 pb-8">
      <div className={`container ${getContainerClass()}`}>
        <h2 className="text-2xl font-bold mb-4">Similar Products</h2>
        <div className={`grid ${getGridClass()} gap-4`}>
          {displayedProducts.map((product: Product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
        
        {products.length > 4 && (
          <div className="mt-6 flex justify-center">
            {visibleProducts < products.length ? (
              <Button 
                variant="outline" 
                onClick={showMore}
              >
                Show More
              </Button>
            ) : visibleProducts > 4 && (
              <Button 
                variant="outline" 
                onClick={showLess}
              >
                Show Less
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 