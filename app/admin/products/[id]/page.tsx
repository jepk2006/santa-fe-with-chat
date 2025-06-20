import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/auth-guard';
import { getProductById, getProductInventory } from '@/lib/actions/product.actions';
import { ProductEditForm } from '@/components/admin/product-edit-form';

export const dynamic = 'force-dynamic';

/* ---------- page component ---------- */
export default async function ProductEditPage({ params }: { params: Promise<{ id: string }> }) {
  try {
    // Await params per Next.js 14 requirement
    const { id } = await params;

    await requireAdmin();

    if (!id) {
      console.error('No product ID provided');
      notFound();
    }

    const product = await getProductById(id);
    const inventory = await getProductInventory(id);
    if (!product) {
      console.error('Product not found');
      notFound();
    }

    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-bold">Editar producto</h2>
          <p className="text-gray-500">Actualiza los detalles del producto a continuación. Los cambios se guardan automáticamente.</p>
        </div>

        <div className="space-y-8">
          <ProductEditForm product={product} initialInventory={inventory} />
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error in ProductEditPage:', error);
    notFound();
  }
}