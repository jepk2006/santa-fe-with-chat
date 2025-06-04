'use client';

import React, { useEffect, useRef, useState, ReactNode } from 'react';
import { cn } from '@/lib/utils';

type RevealDirection = 'up' | 'down' | 'left' | 'right' | 'none';

interface RevealProps {
  children: ReactNode;
  direction?: RevealDirection;
  delay?: number;
  className?: string;
  once?: boolean;
  threshold?: number;
}

export default function Reveal({
  children,
  direction = 'up',
  delay = 0,
  className = '',
  once = true,
  threshold = 0.1,
}: RevealProps) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Generate class based on direction
  const getRevealClass = () => {
    switch (direction) {
      case 'up':
        return 'reveal-up';
      case 'down':
        return 'reveal-down';
      case 'left':
        return 'reveal-left';
      case 'right':
        return 'reveal-right';
      case 'none':
      default:
        return 'reveal';
    }
  };

  useEffect(() => {
    const currentRef = ref.current;
    
    if (!currentRef) return;
    
    // Set custom delay property
    if (delay > 0) {
      currentRef.style.setProperty('--reveal-delay', `${delay}ms`);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once) {
            observer.unobserve(currentRef);
          }
        } else if (!once) {
          setIsVisible(false);
        }
      },
      {
        threshold,
        rootMargin: '10px',
      }
    );

    observer.observe(currentRef);

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [delay, once, threshold]);

  return (
    <div
      ref={ref}
      className={cn(getRevealClass(), isVisible && 'visible', className)}
    >
      {children}
    </div>
  );
} 