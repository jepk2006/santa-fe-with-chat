'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart, Search as SearchIcon } from 'lucide-react';
import { useCart } from '@/hooks/use-cart';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useSession } from 'next-auth/react';
import { useEffect } from 'react';

const NAV_LINKS = [
  { href: '/', label: 'Inicio' },
  { href: '/products', label: 'Productos' },
  { href: '/order', label: 'Mis Pedidos' },
  // Add more links as needed
];

const Header = () => {
  const { items } = useCart();
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const pathname = usePathname();
  const { data: session, status } = useSession();

  useEffect(() => {
    console.log('Session status:', status);
    console.log('Session data:', session);
  }, [session, status]);

  const isActive = (path: string) => pathname === path;

  return (
    <header className="w-full bg-white sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-6 flex items-center h-20">
        {/* Logo */}
        <Link href="/" className="flex items-center flex-shrink-0 mr-8">
          <Image
            src="/images/logo.png"
            alt="Logo"
            width={80}
            height={80}
            className="object-contain w-20 h-20"
            priority
          />
        </Link>

        {/* Centered Navigation */}
        <nav className="flex-1 flex justify-center">
          <ul className="flex gap-8">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={cn(
                    'text-base font-semibold transition-colors hover:text-black',
                    isActive(link.href) ? 'text-black' : 'text-neutral-600'
                  )}
                >
                  {link.label}
                </Link>
              </li>
            ))}
            {status === 'authenticated' && (
              <li>
                <Link
                  href="/admin"
                  className={cn(
                    'text-base font-semibold transition-colors hover:text-black',
                    isActive('/admin') ? 'text-black' : 'text-neutral-600'
                  )}
                >
                  Administración
                </Link>
              </li>
            )}
          </ul>
        </nav>

        {/* Search and Cart Icon */}
        <div className="flex items-center gap-4 ml-8">
          {/* Minimalist Search Bar */}
          <form action="/products" method="GET" className="hidden md:flex items-center bg-neutral-100 rounded-full px-3 py-1 w-56 focus-within:bg-neutral-200 transition">
            <SearchIcon className="h-4 w-4 text-neutral-500 mr-2" />
            <input
              type="text"
              name="q"
              placeholder="Buscar"
              className="bg-transparent outline-none border-none text-sm w-full placeholder:text-neutral-500"
              autoComplete="off"
            />
          </form>
          {/* Cart Icon */}
          <Link href="/cart" className="p-2 rounded-full hover:bg-neutral-100 transition relative">
            <ShoppingCart className="h-5 w-5 text-neutral-700" />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-black text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold">
                {itemCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
