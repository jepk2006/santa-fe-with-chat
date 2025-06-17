"use client";

import React, { useState, useEffect, useRef } from "react";
import { Product } from "@/types";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import AnimatedText from "@/components/ui/animated-text";

const AUTO_ROTATE_INTERVAL = 10000; // 10 seconds

export default function FeaturedProductsScroll({ 
  products 
}: { 
  products: Product[] 
}) {
  // Filter out products without banners
  const productsWithBanners = products.filter(product => product.banner);

  if (productsWithBanners.length === 0) {
    return null;
  }

  // State to track the current featured product index
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const autoRotateTimerRef = useRef<NodeJS.Timeout | null>(null);
  const featuredProduct = productsWithBanners[currentIndex];
  const mainContainerRef = useRef<HTMLDivElement>(null);
  
  // Setup auto-rotation
  useEffect(() => {
    const startAutoRotate = () => {
      if (productsWithBanners.length <= 1) return;
      
      // Clear any existing timer
      if (autoRotateTimerRef.current) {
        clearInterval(autoRotateTimerRef.current);
      }
      
      // Start a new timer
      autoRotateTimerRef.current = setInterval(() => {
        if (!isPaused) {
          setCurrentIndex(prevIndex => 
            prevIndex === productsWithBanners.length - 1 ? 0 : prevIndex + 1
          );
        }
      }, AUTO_ROTATE_INTERVAL);
    };

    startAutoRotate();

    // Cleanup on unmount
    return () => {
      if (autoRotateTimerRef.current) {
        clearInterval(autoRotateTimerRef.current);
      }
    };
  }, [productsWithBanners.length, isPaused]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  const handlePrev = () => {
    // Temporarily pause auto-rotation when manually navigating
    setIsPaused(true);
    setCurrentIndex((prev) => 
      prev === 0 ? productsWithBanners.length - 1 : prev - 1
    );
    
    // Resume auto-rotation after a delay
    setTimeout(() => setIsPaused(false), 5000);
  };

  const handleNext = () => {
    // Temporarily pause auto-rotation when manually navigating
    setIsPaused(true);
    setCurrentIndex((prev) => 
      prev === productsWithBanners.length - 1 ? 0 : prev + 1
    );
    
    // Resume auto-rotation after a delay
    setTimeout(() => setIsPaused(false), 5000);
  };

  // Pause rotation when user hovers over the container
  const handleMouseEnter = () => setIsPaused(true);
  const handleMouseLeave = () => setIsPaused(false);

  return (
    <div 
      ref={mainContainerRef}
      className="flex flex-col mb-6 sm:mb-8 md:mb-12 lg:mb-16 xl:mb-20"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={featuredProduct.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full"
          >
            <div className="text-center max-w-5xl mx-auto px-4 mb-4 sm:mb-6 md:mb-8 py-2 md:py-4">
              {featuredProduct.category && (
                <span className="text-xs sm:text-sm md:text-lg lg:text-xl font-medium text-brand-red uppercase tracking-wider mb-2 sm:mb-3 md:mb-4 block">
                  {featuredProduct.category}
                </span>
              )}
              <AnimatedText
                text={featuredProduct.name}
                className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight font-heading text-center"
                delay={0.05}
                stagger={0.03}
              />
              {featuredProduct.description && (
                <AnimatedText
                  text={featuredProduct.description}
                  className="text-muted-foreground mt-3 sm:mt-4 md:mt-5 lg:mt-6 max-w-sm sm:max-w-xl md:max-w-2xl mx-auto text-sm md:text-base line-clamp-3 text-center px-2 sm:px-0"
                  delay={0.05}
                  stagger={0.025}
                />
              )}
              <div className="mt-4 sm:mt-5 md:mt-6 lg:mt-8">
                <Button asChild size={isMobile ? 'default' : 'lg'} className="rounded-full">
                  <Link href={`/product/${featuredProduct.slug}`}>Ver producto <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
              </div>
              {productsWithBanners.length > 1 && (
                <div className="mt-2 sm:mt-3 md:mt-4 text-xs md:text-sm text-muted-foreground">
                  {currentIndex + 1} / {productsWithBanners.length}
                </div>
              )}
            </div>

            <div className="w-full max-w-[96vw] sm:max-w-[98vw] mx-auto px-2 sm:px-0">
              <Link href={`/product/${featuredProduct.slug}`} className="block relative h-[300px] sm:h-[400px] md:h-[500px] lg:h-[600px] w-full rounded-2xl sm:rounded-3xl overflow-hidden">
                <Image
                  src={featuredProduct.banner || ""}
                  alt={featuredProduct.name}
                  fill
                  priority
                  className="object-contain object-center w-full h-full"
                  sizes="98vw"
                />
              </Link>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation arrows - only show if more than one product */}
        {productsWithBanners.length > 1 && (
          <>
            <button 
              onClick={handlePrev}
              className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-30 flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm text-white shadow-md hover:bg-black/60 transition-all cursor-pointer"
              aria-label="Previous product"
              type="button"
            >
              <ChevronLeft className="h-5 w-5 md:h-6 md:w-6" />
            </button>
            <button 
              onClick={handleNext}
              className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-30 flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm text-white shadow-md hover:bg-black/60 transition-all cursor-pointer"
              aria-label="Next product"
              type="button"
            >
              <ChevronRight className="h-5 w-5 md:h-6 md:w-6" />
            </button>
          </>
        )}
      </div>
    </div>
  );
} 