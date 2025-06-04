'use client';
import { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ProductImages = ({ images = [] }: { images: string[] }) => {
  const [current, setCurrent] = useState(0);
  const [imageError, setImageError] = useState<Record<number, boolean>>({});

  // Ensure we have a valid URL for the current image
  const getDisplayUrl = (index: number) => {
    if (imageError[index] || !images[index]) {
      return '/images/placeholder.jpg';
    }
    return images[index];
  };

  // Handle setting current image and ensuring it's a valid index
  const handleSetCurrent = (index: number) => {
    if (index >= 0 && index < images.length) {
      setCurrent(index);
    }
  };

  // Handle image load error
  const handleImageError = (index: number) => {
    setImageError(prev => ({ ...prev, [index]: true }));
  };

  // Navigate to previous image
  const goToPrevious = () => {
    const newIndex = current === 0 ? images.length - 1 : current - 1;
    handleSetCurrent(newIndex);
  };

  // Navigate to next image
  const goToNext = () => {
    const newIndex = current === images.length - 1 ? 0 : current + 1;
    handleSetCurrent(newIndex);
  };

  // Only show navigation if there are multiple images
  const showNavigation = images.length > 1;

  return (
    <div className='space-y-4'>
      <div className="relative aspect-square bg-muted/10 rounded-md overflow-hidden">
        <Image
          src={getDisplayUrl(current)}
          alt='Product image'
          fill
          priority
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className='object-contain'
          onError={() => handleImageError(current)}
        />

        {showNavigation && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-background/80 hover:bg-background rounded-full"
              onClick={goToPrevious}
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-background/80 hover:bg-background rounded-full"
              onClick={goToNext}
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          </>
        )}
      </div>
      <div className='flex flex-wrap gap-2'>
        {images.map((image, index) => (
          <div
            key={`thumbnail-${index}`}
            onClick={() => handleSetCurrent(index)}
            className={cn(
              'cursor-pointer rounded-md overflow-hidden w-20 h-20 relative flex items-center justify-center bg-background',
              current === index 
                ? 'ring-2 ring-primary ring-offset-2' 
                : 'border hover:ring-1 hover:ring-primary/50'
            )}
          >
            <div className="relative w-full h-full flex items-center justify-center">
              <Image 
                src={getDisplayUrl(index)} 
                alt={`Product thumbnail ${index + 1}`} 
                fill
                sizes="80px"
                className='object-contain' 
                onError={() => handleImageError(index)}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductImages;
