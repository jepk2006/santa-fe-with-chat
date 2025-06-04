'use client';

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Product } from '@/types';
import Autoplay from 'embla-carousel-autoplay';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

const ProductCarousel = ({ data }: { data: Product[] }) => {
  // Filter out products without banners
  const productsWithBanners = data.filter(product => product.banner);

  if (productsWithBanners.length === 0) {
    return null;
  }

  return (
    <Carousel
      className='w-full mb-12'
      opts={{
        loop: true,
      }}
      plugins={[
        Autoplay({
          delay: 10000,
          stopOnInteraction: true,
          stopOnMouseEnter: true,
        }),
      ]}
    >
      <CarouselContent>
        {productsWithBanners.map((product: Product) => (
          <CarouselItem key={product.id}>
            <Link href={`/product/${product.slug}`} className="block relative">
              <div className='relative mx-auto max-w-5xl lg:max-w-4xl xl:max-w-5xl overflow-hidden rounded-lg'>
                <Image
                  src={product.banner || ''}
                  alt={product.name}
                  height='0'
                  width='0'
                  sizes='(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1024px'
                  className='w-full h-auto mx-auto object-cover transition-transform duration-700 hover:scale-105'
                />
                <div className='absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent'>
                  <div className='absolute bottom-0 left-0 right-0 p-6 flex flex-col items-start'>
                    <div className="mb-3 inline-block px-3 py-1 bg-primary text-primary-foreground text-xs uppercase tracking-wider rounded-full font-medium">
                      Featured
                    </div>
                    <h2 className='text-3xl md:text-4xl font-bold text-white mb-2 font-heading'>
                      {product.name}
                    </h2>
                    {product.description && (
                      <p className='text-white/90 mb-4 max-w-xl line-clamp-2'>
                        {product.description}
                      </p>
                    )}
                    <Button variant="outline" className="bg-white/20 backdrop-blur-sm hover:bg-white/30 border-white/40 text-white">
                      View Details <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </div>
            </Link>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="hidden sm:flex" />
      <CarouselNext className="hidden sm:flex" />
    </Carousel>
  );
};

export default ProductCarousel;
