import { Metadata } from 'next';
import { requireAdmin } from '@/lib/auth-guard';
import { ProductForm } from '@/components/admin/product-form';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Create Product',
};

export default async function CreateProductPage() {
  await requireAdmin();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-bold tracking-tight">Create Product</h1>
      <ProductForm type="Create" />
      </div>
  );
}
