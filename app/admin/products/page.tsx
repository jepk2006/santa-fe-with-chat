import { Metadata } from 'next';
import { requireAdmin } from '@/lib/auth-guard';
import { getAllProducts } from '@/lib/actions/product.actions';
import { DataTable } from '@/components/admin/data-table';
import { columns } from './columns';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Plus } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Products',
};

export default async function ProductsPage() {
  await requireAdmin();
  const { data: products } = await getAllProducts({ 
    page: 1,
    query: 'all'
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Productos</h1>
        <Button asChild>
          <Link href="/admin/products/create">
            <Plus className="mr-2 h-4 w-4" />
            Agregar Producto
              </Link>
        </Button>
      </div>
      <DataTable columns={columns} data={products} />
    </div>
  );
}
