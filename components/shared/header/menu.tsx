'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Menu as MenuIcon, ShoppingCart, LayoutDashboard, Home, Store, Info, Phone, Package, User2 } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useCart } from '@/hooks/use-cart';
import { createBrowserClient } from '@supabase/ssr';
import { useEffect, useState } from 'react';
import { SUPABASE_ROLES } from '@/lib/constants';
import { User } from '@/lib/types';
import { hasPermission } from '@/lib/auth';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { NAV_LINKS } from './index';

const ICONS = {
  Home,
  Store,
  Info,
  Phone,
  Package,
};

interface MenuProps {
  user?: User;
  isAdminPage?: boolean;
}

const Menu = ({ user, isAdminPage = false }: MenuProps) => {
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    if (!user) {
      const checkAdminStatus = async () => {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          const { data: profile } = await supabase
            .from('users')
            .select('role')
            .eq('id', authUser.id)
            .single();
          
          setIsAdmin(profile?.role === SUPABASE_ROLES.ADMIN);
        }
      };
      checkAdminStatus();
    } else {
      setIsAdmin(user.role === SUPABASE_ROLES.ADMIN);
    }
  }, [supabase, user]);

  // Admin navigation routes
  const adminRoutes = isAdminPage ? [
    {
      href: '/admin/overview',
      label: 'Dashboard',
      active: pathname === '/admin' || pathname === '/admin/overview',
      show: true,
    },
    {
      href: '/admin/users',
      label: 'Usuarios',
      active: pathname === '/admin/users',
      show: user ? hasPermission(user, 'canAccessUsers') : false,
    },
    {
      href: '/admin/products',
      label: 'Productos',
      active: pathname === '/admin/products',
      show: user ? hasPermission(user, 'canAccessProducts') : false,
    },
    {
      href: '/admin/pedidos',
      label: 'Pedidos',
      active: pathname === '/admin/pedidos',
      show: user ? hasPermission(user, 'canAccessOrders') : false,
    },
  ].filter(route => route.show) : [];

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-10 w-10">
          <MenuIcon className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-80">
        <SheetHeader className="border-b pb-4">
          <SheetTitle>Menú</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-6">
          {/* Main Navigation */}
          <div className="space-y-2">
            {NAV_LINKS.map((link) => {
              const Icon = ICONS[link.icon as keyof typeof ICONS];
              return (
                <Button
                  key={link.href}
                  asChild
                  variant={pathname === link.href ? 'default' : 'ghost'}
                  className="w-full justify-start"
                >
                  <Link href={link.href} className="flex items-center">
                    {Icon && <Icon className="mr-3 h-4 w-4" />}
                    {link.label}
                  </Link>
                </Button>
              );
            })}
          </div>

          {/* Account Section */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground px-2">Cuenta</h3>
            <Button
              asChild
              variant="ghost"
              className="w-full justify-start"
            >
              <Link href={user ? '/account' : '/login'} className="flex items-center">
                <User2 className="mr-3 h-4 w-4" />
                {user ? 'Mi Cuenta' : 'Iniciar Sesión'}
              </Link>
            </Button>
          </div>

          {/* Admin Section */}
          {isAdmin && !isAdminPage && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground px-2">Administración</h3>
              <Button
                asChild
                variant="ghost"
                className="w-full justify-start"
              >
                <Link href="/admin/overview" className="flex items-center">
                  <LayoutDashboard className="mr-3 h-4 w-4" />
                  Panel de Admin
                </Link>
              </Button>
            </div>
          )}

          {/* Admin Navigation */}
          {isAdminPage && adminRoutes.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground px-2">Admin Navigation</h3>
              {adminRoutes.map((route) => (
                <Button
                  key={route.href}
                  asChild
                  variant={route.active ? 'default' : 'ghost'}
                  className="w-full justify-start"
                >
                  <Link href={route.href}>
                    {route.label}
                  </Link>
                </Button>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default Menu;
