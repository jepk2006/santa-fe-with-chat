'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { MoreVertical, ShoppingCart, LayoutDashboard } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import { useTheme } from 'next-themes';
import SmoothLink from '@/components/ui/smooth-link';

interface MenuProps {
  user?: User;
  isAdminPage?: boolean;
}

const Menu = ({ user, isAdminPage = false }: MenuProps) => {
  const { items } = useCart();
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const [isAdmin, setIsAdmin] = useState(false);
  const pathname = usePathname();
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    // Only check admin status if user is not provided
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
      // If user is provided, we can check admin status directly
      setIsAdmin(user.role === SUPABASE_ROLES.ADMIN);
    }
  }, [supabase, user]);

  // Admin navigation routes (only shown when on admin pages)
  const adminRoutes = isAdminPage ? [
    {
      href: '/admin/overview',
      label: 'Dashboard',
      active: pathname === '/admin' || pathname === '/admin/overview',
      show: true, // Always show dashboard for admins
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
  ] : [];

  // Filter visible admin routes
  const visibleAdminRoutes = adminRoutes.filter(route => route.show);

  return (
    <div className='flex justify-end gap-3'>
      <nav className='hidden md:flex w-full max-w-xs gap-1'>
        {isAdmin && !isAdminPage && (
          <Button asChild variant='ghost'>
            <SmoothLink href='/admin/overview'>
              <LayoutDashboard />
            </SmoothLink>
          </Button>
        )}
        <Button asChild variant='ghost' className="relative">
          <SmoothLink href='/cart'>
            <ShoppingCart />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
                {itemCount}
              </span>
            )}
          </SmoothLink>
        </Button>
      </nav>
      <nav className='md:hidden flex items-center gap-2'>
        <Button asChild variant='ghost' className="relative">
          <SmoothLink href='/cart'>
            <ShoppingCart />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
                {itemCount}
              </span>
            )}
          </SmoothLink>
        </Button>
        <Sheet>
          <SheetTrigger className='align-middle'>
            <MoreVertical />
          </SheetTrigger>
          <SheetContent className='flex flex-col items-start'>
            <SheetTitle>Menu</SheetTitle>
            <div className="w-full py-4 space-y-4">
              {/* Admin Navigation Links (only on admin pages) */}
              {isAdminPage && visibleAdminRoutes.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Admin Navigation</h3>
                  <div className="flex flex-col space-y-2">
                    {visibleAdminRoutes.map((route) => (
                      <Button key={route.href} asChild variant={route.active ? 'default' : 'ghost'} className="justify-start">
                        <SmoothLink href={route.href}>
                          {route.label}
                        </SmoothLink>
                      </Button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Other Menu Items */}
              <div className="flex flex-col space-y-2">
                <Button asChild variant='ghost' className="justify-start w-full p-2">
                  <Link href='/order' className="flex items-center" aria-label="Order tracking">
                    <ShoppingCart className="mr-2 h-4 w-4" />
                  </Link>
                </Button>
                {isAdmin && !isAdminPage && (
                  <Button asChild variant='ghost' className="justify-start w-full p-2">
                    <Link href='/admin/overview' className="flex items-center">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      <span>Admin Dashboard</span>
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </div>
  );
};

export default Menu;
