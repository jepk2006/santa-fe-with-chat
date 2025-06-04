import Image from 'next/image';
import Link from 'next/link';
import Menu from './menu';
import CategoryDrawer from './category-drawer';
import Search from './search';
import SmoothLink from '@/components/ui/smooth-link';
import { Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Header = () => {
  return (
    <header className='w-full border-b py-1 bg-background/95 backdrop-blur-sm sticky top-0 z-40 transition-all duration-200'>
      <div className='wrapper flex-between h-16 relative'>
        <div className='flex items-center md:flex-none'>
          <CategoryDrawer />
          <SmoothLink 
            href='/' 
            className='absolute left-1/2 -translate-x-1/2 md:static md:translate-x-0 md:ml-4 flex items-center justify-center transition-opacity duration-200 hover:opacity-90'
          >
            <Image
              src='/images/logo.png'
              alt='Logo'
              width={140}
              height={55}
              className='object-contain md:w-[240px] w-[200px]'
              priority
            />
          </SmoothLink>
        </div>
        <div className='hidden md:block flex-1 max-w-lg mx-auto px-4'>
          <Search />
        </div>
        <div className="hidden md:flex items-center mr-4">
          <Button asChild variant='ghost'>
            <SmoothLink
              href="/order"
              aria-label="Track order"
            >
              <Truck className="h-4 w-4" />
            </SmoothLink>
          </Button>
        </div>
        <Menu />
      </div>
    </header>
  );
};

export default Header;
