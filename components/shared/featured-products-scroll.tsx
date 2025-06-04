"use client";

import React, { useState, useEffect, useRef } from "react";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";
import { Product } from "@/types";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { AnimatePresence, motion, useScroll, useTransform } from "framer-motion";

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
  
  // For parallax scroll effect
  const { scrollYProgress } = useScroll({
    target: mainContainerRef,
    offset: ["start start", "end start"]
  });

  // Parallax effect values
  const parallaxY = useTransform(scrollYProgress, [0, 1], [0, 300]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

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
      className="flex flex-col overflow-hidden mb-16 md:mb-24 lg:mb-32"
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
            <ContainerScroll
              titleComponent={
                <>
                  <h1 className="text-4xl font-semibold text-black">
                    {featuredProduct.category ? (
                      <span className="text-sm md:text-xl font-medium text-primary uppercase tracking-wider mb-4 block">
                        {featuredProduct.category}
                      </span>
                    ) : null}
                    <span className="text-3xl md:text-4xl lg:text-[5rem] font-bold mt-1 leading-none font-heading">
                      {featuredProduct.name}
                    </span>
                  </h1>
                  {featuredProduct.description && (
                    <p className="text-muted-foreground mt-2 md:mt-4 max-w-2xl mx-auto text-sm md:text-base line-clamp-2 md:line-clamp-3">
                      {featuredProduct.description}
                    </p>
                  )}
                  <div className="mt-4 md:mt-8">
                    <Button asChild size={isMobile ? "default" : "lg"} className="rounded-full">
                      <Link href={`/product/${featuredProduct.slug}`}>
                        View Product <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>

                  {/* Product counter */}
                  {productsWithBanners.length > 1 && (
                    <div className="mt-2 md:mt-4 text-xs md:text-sm text-muted-foreground">
                      {currentIndex + 1} / {productsWithBanners.length}
                    </div>
                  )}
                </>
              }
            >
              <div className="w-full max-w-[98vw] mx-auto">
                <Link href={`/product/${featuredProduct.slug}`} className="block relative h-[600px] w-full rounded-2xl overflow-hidden">
                  <Image
                    src={featuredProduct.banner || ""}
                    alt={featuredProduct.name}
                    fill
                    priority
                    className="object-contain object-center w-full h-full"
                    sizes="98vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-70"></div>
                </Link>
              </div>
            </ContainerScroll>
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

      {/* Other featured products with parallax effect */}
      {productsWithBanners.length > 1 && (
        <motion.div 
          style={{ translateY: parallaxY, opacity }}
          className="max-w-7xl mx-auto px-4 sm:px-6 mt-20 relative z-10 pt-4"
        >
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center font-heading text-black">More Featured Products</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {productsWithBanners
              .filter((_, index) => index !== currentIndex)
              .slice(0, 3)
              .map((product) => (
                <Link 
                  key={product.id} 
                  href={`/product/${product.slug}`}
                  className="group block overflow-hidden rounded-2xl shadow-lg bg-white hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                >
                  <div className="aspect-[16/9] relative overflow-hidden">
                    <Image
                      src={product.banner || ""}
                      alt={product.name}
                      fill
                      className="object-cover object-center w-full h-full transform group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                    <div className="absolute bottom-4 left-4 right-4 text-white">
                      <h3 className="font-bold text-base md:text-xl line-clamp-1">{product.name}</h3>
                      {product.category && (
                        <div className="text-xs uppercase tracking-wider text-white/70 mt-1">
                          {product.category}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
          </div>
        </motion.div>
      )}
    </div>
  );
} 