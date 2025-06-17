'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart, Search as SearchIcon, User2 } from 'lucide-react';
import { useCart } from '@/hooks/use-cart';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import React from 'react';
import { supabase } from '@/lib/supabase-client';

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
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_evt, session) => {
      setUser(session?.user ?? null);
    });

    // initial load
    supabase.auth.getUser().then(({ data: { user }, error }) => {
      if (error && error.name !== 'AuthSessionMissingError') {
      }
      setUser(user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const isSignedIn = !!user;

  const isActive = (path: string) => pathname === path;

  return (
    <header className="w-full bg-brand-white sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center h-16 sm:h-20">
        {/* Logo */}
        <Link href="/" className="flex items-center flex-shrink-0 mr-4 sm:mr-8">
          <Image
            src="/images/logo.png"
            alt="Logo"
            width={160}
            height={160}
            className="object-contain w-20 h-20 sm:w-24 sm:h-24"
            priority
          />
        </Link>

        {/* Centered Navigation - Hidden on mobile */}
        <nav className="hidden lg:flex flex-1 justify-center">
          <ul className="flex gap-6 xl:gap-8">
            {NAV_LINKS.map((link, idx) => {
              const isMisPedidos = link.label === 'Mis Pedidos';
              return (
                <React.Fragment key={link.href}>
                  <li>
                    <Link
                      href={link.href}
                      className={cn(
                        'text-sm xl:text-base font-semibold transition-colors hover:text-gray-700',
                        isActive(link.href) ? 'text-gray-700' : 'text-gray-700 opacity-70'
                      )}
                    >
                      {link.label}
                    </Link>
                  </li>
                  {isMisPedidos && isSignedIn && (
                    <li key="admin-overview">
                      <Link
                        href="/admin/overview"
                        className={cn(
                          'text-sm xl:text-base font-semibold transition-colors hover:text-gray-700',
                          isActive('/admin/overview') ? 'text-gray-700' : 'text-gray-700 opacity-70'
                        )}
                      >
                        Admin
                      </Link>
                    </li>
                  )}
                </React.Fragment>
              );
            })}
          </ul>
        </nav>

        {/* Mobile Navigation - All essential links */}
        <nav className="flex lg:hidden flex-1 justify-center">
          <ul className="flex gap-2 sm:gap-3">
            {NAV_LINKS.map((link, idx) => {
              const isMisPedidos = link.label === 'Mis Pedidos';
              // Show shorter text on very small screens
              const mobileLabel = link.label === 'Productos' ? 'Productos' : 
                                 link.label === 'Mis Pedidos' ? 'Pedidos' : 
                                 link.label;
              
              return (
                <React.Fragment key={link.href}>
                  <li>
                    <Link
                      href={link.href}
                      className={cn(
                        'text-xs sm:text-sm font-semibold transition-colors hover:text-gray-700 px-1',
                        isActive(link.href) ? 'text-gray-700' : 'text-gray-700 opacity-70'
                      )}
                    >
                      {mobileLabel}
                    </Link>
                  </li>
                  {isMisPedidos && isSignedIn && (
                    <li key="admin-overview-mobile">
                      <Link
                        href="/admin/overview"
                        className={cn(
                          'text-xs sm:text-sm font-semibold transition-colors hover:text-gray-700 px-1',
                          isActive('/admin/overview') ? 'text-gray-700' : 'text-gray-700 opacity-70'
                        )}
                      >
                        Admin
                      </Link>
                    </li>
                  )}
                </React.Fragment>
              );
            })}
          </ul>
        </nav>

        {/* Search, Cart, and User Icon */}
        <div className="flex items-center gap-2 sm:gap-4 ml-4 sm:ml-8">
          {/* Minimalist Search Bar - Hidden on mobile */}
          <form action="/products" method="GET" className="hidden md:flex items-center bg-brand-white border border-gray-200 rounded-full px-3 py-1 w-48 xl:w-56 focus-within:bg-opacity-80 transition">
            <SearchIcon className="h-4 w-4 text-gray-700 opacity-60 mr-2" />
            <input
              type="text"
              name="q"
              placeholder="Buscar"
              className="bg-transparent outline-none border-none text-sm w-full placeholder:text-gray-700 placeholder:opacity-50 text-gray-700"
              autoComplete="off"
            />
          </form>
          
          {/* Mobile Search Icon */}
          <Link href="/products" className="md:hidden p-2 rounded-full hover:bg-gray-100 transition">
            <SearchIcon className="h-5 w-5 text-gray-700" />
          </Link>

          {/* Cart Icon */}
          <Link href="/cart" className="p-2 rounded-full hover:bg-gray-100 transition relative">
            <ShoppingCart className="h-5 w-5 text-gray-700" />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-brand-red text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold">
                {itemCount}
              </span>
            )}
          </Link>

          {/* User / Login Icon */}
          {!isSignedIn ? (
            <Link href="/login" className="p-2 rounded-full hover:bg-gray-100 transition">
              <User2 className="h-5 w-5 text-gray-700" />
            </Link>
          ) : (
            <Link href="/account" className="p-2 rounded-full hover:bg-gray-100 transition">
              <User2 className="h-5 w-5 text-gray-700" />
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
