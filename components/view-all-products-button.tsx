import { Button } from './ui/button';
import Link from 'next/link';

const ViewAllProductsButton = () => {
  return (
    <div className='flex items-center justify-center'>
      <Button asChild variant='default' className='w-fit'>
        <Link href='/products'>Ver Todos los Productos</Link>
      </Button>
    </div>
  );
};

export default ViewAllProductsButton;
