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
    <div className='my-6 sm:my-8 md:my-10'>
      {title && <h2 className='h2-bold mb-3 sm:mb-4'>{title}</h2>}
      {data?.length > 0 ? (
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-5 md:gap-6 lg:gap-8 xl:gap-10'>
          {limitedData.map((product: Product, index: number) => (
            <Reveal 
              key={product.slug} 
              direction="up" 
              delay={50 * index} 
              threshold={0.1}
            >
              <ProductCard product={product} />
            </Reveal>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No products found</p>
        </div>
      )}
    </div>
  );
};

export default ProductList;
