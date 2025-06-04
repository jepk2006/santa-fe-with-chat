import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/auth-guard';
import { getProductById } from '@/lib/actions/product.actions';
import { ProductForm } from '@/components/admin/product-form';

export const dynamic = 'force-dynamic';

/* ---------- route metadata ---------- */
export const metadata: Metadata = { title: 'Edit Product' };

/* ---------- prop type ---------- */
type PageProps = {
  params: Promise<{ id: string }>;
};

/* ---------- page component ---------- */
export default async function EditProductPage({ params }: PageProps) {
  await requireAdmin();

  const { id } = await params;          // ⬅️ await the promise

  const product = await getProductById(id);
  if (!product) notFound();

  return (
    <div className='flex flex-col gap-4'>
      <h1 className='text-3xl font-bold tracking-tight'>Edit Product</h1>
      <ProductForm type='Update' product={product} productId={product.id} />
    </div>
  );
}