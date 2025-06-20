import { Metadata } from 'next';
import { getProductBySlug, getSimilarProducts, getProductInventory } from '@/lib/actions/product.actions';
import { notFound } from 'next/navigation';
import ProductDetails from './product-details';
import { createClient } from '@/lib/supabase-server';
import SimilarProducts from './similar-products';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Product Details',
};

/* ---------- typed props ---------- */
type PageProps = {
  params: Promise<{ slug: string }>;
  // add this if you ever read the query-string:
  // searchParams?: Promise<{ [k: string]: string | string[] | undefined }>;
};

/* ---------- page component ---------- */
export default async function ProductDetailsPage({ params }: PageProps) {
  // params is a Promise now, so await it before use
  const { slug } = await params;

  const supabase = await createClient();

  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Get product inventory
  const inventory = await getProductInventory(product.id);

  // Get similar products if the product has a category
  let similarProducts = [];
  if (product.category) {
    similarProducts = await getSimilarProducts(product.category, product.id);
  }

  return (
    <>
      <ProductDetails product={product} user={user} inventory={inventory} />
      {product.category && similarProducts.length > 0 && (
        <SimilarProducts 
          category={product.category} 
          currentProductId={product.id}
          initialProducts={similarProducts}
        />
      )}
    </>
  );
}
