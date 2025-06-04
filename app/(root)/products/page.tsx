import { Metadata } from 'next';
import { getAllProducts } from '@/lib/actions/product.actions';
import ProductList from '@/components/shared/product/product-list';

export const metadata: Metadata = {
  title: 'All Products',
};

// Next.js 15 uses a simpler config object for dynamic rendering
export const dynamic = 'force-dynamic';

const ProductsPage = async () => {
  // Fetch fresh data on every request
  const products = await getAllProducts({ page: 1, query: 'all' });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">All Products</h1>
      <ProductList 
        data={products.data} 
      />
    </div>
  );
};

export default ProductsPage;