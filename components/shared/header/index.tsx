'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart, Search as SearchIcon, User2 } from 'lucide-react';
import { useCart } from '@/hooks/use-cart';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import React from 'react';
import { supabase } from '@/lib/supabase-client';
import Menu from './menu';
import { User } from '@/lib/types';
import { User as SupabaseUser } from '@supabase/supabase-js';

export const NAV_LINKS = [
  { href: '/', label: 'Inicio', icon: 'Home' },
  { href: '/products', label: 'Productos', icon: 'Store' },
  { href: '/about', label: 'Sobre Nosotros', icon: 'Info' },
  { href: '/contact', label: 'Contáctanos', icon: 'Phone' },
  { href: '/order', label: 'Mis Pedidos', icon: 'Package' },
];

const Header = () => {
  const { items } = useCart();
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_evt, session) => {
      if (session?.user) {
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profile) {
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            role: profile.role,
            created_at: session.user.created_at || new Date().toISOString(),
            updated_at: session.user.updated_at || new Date().toISOString()
          });
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    });

    // initial load
    supabase.auth.getUser().then(async ({ data: { user: authUser }, error }) => {
      if (error || !authUser) {
        setUser(null);
        return;
      }

      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (profile) {
        setUser({
          id: authUser.id,
          email: authUser.email || '',
          role: profile.role,
          created_at: authUser.created_at || new Date().toISOString(),
          updated_at: authUser.updated_at || new Date().toISOString()
        });
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const isSignedIn = !!user;

  return (
    <header className="w-full bg-brand-white sticky top-0 z-40 border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center flex-shrink-0">
          <Image
            src="/images/logo.png"
            alt="Logo"
            width={160}
            height={160}
            className="object-contain h-14 w-auto"
            priority
          />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center justify-center flex-1 px-8">
          <ul className="flex gap-6 xl:gap-8">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={cn(
                    'text-sm xl:text-base font-semibold transition-colors hover:text-gray-700',
                    pathname === link.href ? 'text-gray-900' : 'text-gray-600'
                  )}
                >
                  {link.label}
                </Link>
              </li>
            ))}
            {isSignedIn && user.role === 'admin' && (
              <li>
                <Link
                  href="/admin/overview"
                  className={cn(
                    'text-sm xl:text-base font-semibold transition-colors hover:text-gray-700',
                    pathname === '/admin/overview' ? 'text-gray-900' : 'text-gray-600'
                  )}
                >
                  Admin
                </Link>
              </li>
            )}
          </ul>
        </nav>

        {/* Right Section - Search, Cart, User, Menu */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Desktop Search */}
          <form action="/products" method="GET" className="hidden lg:flex items-center bg-gray-50 border border-gray-200 rounded-full px-3 py-1.5 w-48 xl:w-56 focus-within:border-gray-300 transition">
            <SearchIcon className="h-4 w-4 text-gray-500 flex-shrink-0" />
            <input
              type="text"
              name="q"
              placeholder="Buscar productos"
              className="bg-transparent outline-none border-none text-sm w-full ml-2 placeholder:text-gray-500"
              autoComplete="off"
            />
          </form>
          
          {/* Mobile Search Icon */}
          <Link href="/products" className="lg:hidden p-2 rounded-full hover:bg-gray-100 transition">
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

          {/* User Icon - Desktop Only */}
          <div className="hidden lg:block">
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

          {/* Mobile Menu */}
          <div className="lg:hidden">
            <Menu user={user ?? undefined} isAdminPage={pathname?.startsWith('/admin')} />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
