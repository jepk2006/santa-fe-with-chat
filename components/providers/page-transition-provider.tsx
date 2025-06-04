'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';

interface PageTransitionProviderProps {
  children: ReactNode;
}

export default function PageTransitionProvider({ children }: PageTransitionProviderProps) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{
          duration: 0.2,
          ease: [0.25, 0.1, 0.25, 1.0], // Cubic bezier for smoother transition
        }}
        className="min-h-[calc(100vh-4rem)]" // Adjust based on your header height
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
} 