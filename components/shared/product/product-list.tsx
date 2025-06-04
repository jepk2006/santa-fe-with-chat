import ProductCard from './product-card';
import { Product } from '@/types';
import Reveal from '@/components/ui/reveal';

const ProductList = ({
  data,
  title,
  limit,
}: {
  data: Product[];
  title?: string;
  limit?: number;
}) => {
  const limitedData = limit ? data.slice(0, limit) : data;

  return (
    <div className='my-10'>
      {title && <h2 className='h2-bold mb-4'>{title}</h2>}
      {data?.length > 0 ? (
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'>
          {limitedData.map((product: Product, index: number) => (
            <Reveal 
              key={product.slug} 
              direction="up" 
              delay={100 * index} 
              threshold={0.1}
            >
              <ProductCard product={product} />
            </Reveal>
          ))}
        </div>
      ) : (
        <div>
          <p>No products found</p>
        </div>
      )}
    </div>
  );
};

export default ProductList;
