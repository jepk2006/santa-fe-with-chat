'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SmoothLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export default function SmoothLink({
  href,
  children,
  className,
  onClick,
}: SmoothLinkProps) {
  return (
    <Link href={href} className={cn('inline-block', className)} onClick={onClick}>
      <motion.div
        whileHover={{ scale: 1.005 }}
        whileTap={{ scale: 0.995 }}
        transition={{ 
          type: "spring",
          stiffness: 300,
          damping: 30,
          mass: 0.5
        }}
      >
        {children}
      </motion.div>
    </Link>
  );
} 