"use client";

import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import ProductPrice from './product-price';
import { Product } from '@/types';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import SmoothLink from '@/components/ui/smooth-link';
import { Scale, Package, Tag } from 'lucide-react';
import { CardBody, CardContainer, CardItem } from '@/components/ui/3d-card';

const ProductCard = ({ product }: { product: Product }) => {
  const [imageError, setImageError] = useState(false);
  
  // Default image if no images are available
  const defaultImage = '/images/placeholder.jpg';
  
  // Ensure images is an array, even if it's not in the product data
  const productImages = Array.isArray(product.images) ? product.images : [];
  const imageUrl = imageError || productImages.length === 0 ? defaultImage : productImages[0];
  
  // Support both camelCase and snake_case for backward compatibility
  const sellingMethod = (product as any).sellingMethod || product.selling_method;
  const weightUnit = (product as any).weightUnit || (product as any).weight_unit;
  
  return (
    <Link href={`/product/${product.slug}`} className="group h-full">
      <CardContainer className="w-full h-full">
        <CardBody className="w-full h-full">
          <Card className='border overflow-hidden transition-all w-full h-full shadow group-hover:shadow-xl'>
            <CardItem translateZ="80" className='aspect-square relative w-full'>
              <Image
                src={imageUrl}
                alt={product.name}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover transition-transform group-hover:scale-110"
                onError={() => setImageError(true)}
                placeholder="blur"
                blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFDQJyTrElGQAAAABJRU5ErkJggg=="
              />
              {!product.inStock && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <Badge variant="outline" className="absolute top-2 right-2 bg-brand-red text-white border-none">
                    Out of Stock
                  </Badge>
                </div>
              )}
              {product.isFeatured && (
                <CardItem translateZ="100" rotateX={-5} rotateY={10} className="absolute top-2 left-2">
                  <Badge variant="outline" className="bg-brand-blue text-white border-none shadow-lg">
                    Featured
                  </Badge>
                </CardItem>
              )}
              
              {/* Category tag - subtle and only visible on hover */}
              {product.category && (
                <CardItem translateZ="120" rotateX={10} rotateY={-15} className="absolute top-2 right-2">
                  <Badge 
                    className="bg-brand-red text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg"
                  >
                    {product.category}
                  </Badge>
                </CardItem>
              )}
            </CardItem>
            <CardItem translateZ="50" className="w-full">
              <CardContent className='p-4 sm:p-5 xl:p-6 2xl:p-7 grid gap-3 xl:gap-4 w-full'>
                <div className='flex justify-between items-start'>
                  <div className='space-y-1 flex-1'>
                    {(product.brand && product.brand !== 'Frigorifico Santa Fe') && (
                      <CardItem translateZ="60" className='text-xs text-muted-foreground font-medium uppercase tracking-wide'>
                        {product.brand}
                      </CardItem>
                    )}
                    <CardItem translateZ="75" className="w-full">
                      <h2 className={`font-medium line-clamp-2 font-heading group-hover:text-primary transition-colors ${!(product.brand && product.brand !== 'Frigorifico Santa Fe') ? 'text-lg xl:text-xl 2xl:text-2xl' : 'text-base xl:text-lg 2xl:text-xl'}`}>{product.name}</h2>
                    </CardItem>
                  </div>
                  <CardItem translateZ="60" rotateY={-5} className="flex flex-col items-end gap-1">
                    {product.inStock && (
                      <ProductPrice 
                        value={Number(product.price)} 
                        weightUnit={(sellingMethod === 'weight_custom' || sellingMethod === 'weight_fixed') ? weightUnit : undefined} 
                        className="text-right font-bold xl:text-lg 2xl:text-xl" 
                      />
                    )}
                    {sellingMethod && (
                      <div className="flex items-center text-xs xl:text-sm text-muted-foreground">
                        {sellingMethod === 'weight_custom' || sellingMethod === 'weight_fixed' ? (
                          <>
                            <Scale className="h-3 w-3 mr-1" />
                            <span>Por peso</span>
                          </>
                        ) : (
                          <>
                            <Package className="h-3 w-3 mr-1" />
                            <span>Por unidad</span>
                          </>
                        )}
                      </div>
                    )}
                  </CardItem>
                </div>
                
                <CardItem translateZ="40" className="w-full">
                  <div className='text-sm xl:text-base text-muted-foreground'>
                    {product.description && (
                      <p className="line-clamp-2">
                        {product.description.substring(0, 70) + (product.description.length > 70 ? '...' : '')}
                      </p>
                    )}
                  </div>
                </CardItem>
              </CardContent>
            </CardItem>
          </Card>
        </CardBody>
      </CardContainer>
    </Link>
  );
};

export default ProductCard;
