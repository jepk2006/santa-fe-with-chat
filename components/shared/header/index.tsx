'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart, Search as SearchIcon } from 'lucide-react';
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
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let ignore = false;
    supabase.auth.getUser().then(({ data: { user }, error }) => {
      console.log('[HEADER] getUser() user:', user);
      if (error) console.error('[HEADER] getUser() error:', error);
      if (ignore) return;
      setUser(user ?? null);
      if (user) {
        console.log('[HEADER] Querying users table with id:', user.id, 'email:', user.email);
        supabase
          .from('users')
          .select('role, id, email')
          .eq('id', user.id)
          .single()
          .then(({ data: userRow, error: userError, status, statusText }) => {
            console.log('[HEADER] users table response:', { userRow, userError, status, statusText });
            if (userRow) {
              console.log('[HEADER] userRow.id:', userRow.id, 'userRow.email:', userRow.email, 'userRow.role:', userRow.role);
            }
            setIsAdmin(userRow?.role === 'admin');
            console.log('[HEADER] isAdmin:', userRow?.role === 'admin');
          });
      } else {
        setIsAdmin(false);
        console.log('[HEADER] No user, isAdmin set to false');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null;
      console.log('[HEADER] onAuthStateChange user:', user);
      setUser(user);
      if (user) {
        console.log('[HEADER] Querying users table with id:', user.id, 'email:', user.email);
        supabase
          .from('users')
          .select('role, id, email')
          .eq('id', user.id)
          .single()
          .then(({ data: userRow, error: userError, status, statusText }) => {
            console.log('[HEADER] users table response:', { userRow, userError, status, statusText });
            if (userRow) {
              console.log('[HEADER] userRow.id:', userRow.id, 'userRow.email:', userRow.email, 'userRow.role:', userRow.role);
            }
            setIsAdmin(userRow?.role === 'admin');
            console.log('[HEADER] isAdmin:', userRow?.role === 'admin');
          });
      } else {
        setIsAdmin(false);
        console.log('[HEADER] No user, isAdmin set to false');
      }
    });
    return () => {
      ignore = true;
      subscription.unsubscribe();
    };
  }, []);

  const isActive = (path: string) => pathname === path;

  return (
    <header className="w-full bg-white sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-6 flex items-center h-20">
        {/* Logo */}
        <Link href="/" className="flex items-center flex-shrink-0 mr-8">
          <Image
            src="/images/logo.png"
            alt="Logo"
            width={160}
            height={160}
            className="object-contain w-20 h-20"
            priority
          />
        </Link>

        {/* Centered Navigation */}
        <nav className="flex-1 flex justify-center">
          <ul className="flex gap-8">
            {NAV_LINKS.map((link, idx) => {
              const isMisPedidos = link.label === 'Mis Pedidos';
              return (
                <React.Fragment key={link.href}>
                  <li>
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
                  {isMisPedidos && isAdmin && (
                    <li key="admin-overview">
                      <Link
                        href="/admin/overview"
                        className={cn(
                          'text-base font-semibold transition-colors hover:text-black',
                          isActive('/admin/overview') ? 'text-black' : 'text-neutral-600'
                        )}
                      >
                        Administración
                      </Link>
                    </li>
                  )}
                </React.Fragment>
              );
            })}
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
