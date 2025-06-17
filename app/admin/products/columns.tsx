'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Product } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { ProductActions } from '@/components/admin/product-actions';
import Image from 'next/image';
import { ArrowUpRight } from 'lucide-react';

export const columns: ColumnDef<Product>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ row }) => {
      const product = row.original;
      // Default image if no images are available
      const defaultImage = '/images/placeholder.jpg';
      const imageUrl = Array.isArray(product.images) && product.images.length > 0 
        ? product.images[0] 
        : defaultImage;
        
      return (
        <div className="flex items-center space-x-3 group">
          <div className="relative h-10 w-10 rounded-md overflow-hidden">
            <Image
              src={imageUrl}
              alt={product.name}
              fill
              className="object-cover"
              onError={(e) => {
                // Fallback to placeholder if image fails to load
                (e.target as HTMLImageElement).src = defaultImage;
              }}
            />
          </div>
          <div className="flex items-center">
            <span className="font-medium">{product.name}</span>
            <ArrowUpRight className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-70 transition-opacity" />
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: 'price',
    header: 'Price',
    cell: ({ row }) => {
      const price = parseFloat(row.getValue('price'));
      return formatCurrency(price);
    },
  },
  {
    accessorKey: 'category',
    header: 'Category',
  },
  {
    accessorKey: 'inStock',
    header: 'Stock Status',
    cell: ({ row }) => {
      // Use a safer way to access inStock that handles potential undefined values
      const inStock = row.original.inStock === true;
      return (
        <div className={inStock ? "text-brand-blue font-medium" : "text-red-300 font-medium"}>
          {inStock ? "In Stock" : "Out of Stock"}
        </div>
      );
    },
  },
  {
    accessorKey: 'rating',
    header: 'Rating',
  },
  {
    id: 'actions',
    cell: ({ row }) => <ProductActions product={row.original} />,
  },
]; 