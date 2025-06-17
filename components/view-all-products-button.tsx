import { Button } from './ui/button';
import Link from 'next/link';

const ViewAllProductsButton = () => {
  return (
    <div className='flex justify-center items-center my-6 sm:my-8'>
      <Button asChild className='px-6 py-3 sm:px-8 sm:py-4 text-base sm:text-lg font-semibold'>
        <Link href='/products'>View All Products</Link>
      </Button>
    </div>
  );
};

export default ViewAllProductsButton;
