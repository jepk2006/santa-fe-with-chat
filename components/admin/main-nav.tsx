'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { User } from '@/lib/types';
import { hasPermission } from '@/lib/auth';

interface MainNavProps {
  className?: string;
  user: User;
}

export function MainNav({ className, user }: MainNavProps) {
  const pathname = usePathname();

  // Make sure we have a valid user with role before checking permissions
  const hasValidUserRole = user && user.role && (user.role === 'admin' || user.role === 'ventas');

  // Default permissions for when user or role is invalid
  const defaultPermissions = {
    canAccessUsers: false,
    canAccessProducts: false,
    canAccessOrders: false
  };

  // If the user is admin, override to allow all
  if (user?.role === 'admin') {
    defaultPermissions.canAccessUsers = true;
    defaultPermissions.canAccessProducts = true;
    defaultPermissions.canAccessOrders = true;
  }

  const routes = [
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
      show: hasValidUserRole ? hasPermission(user, 'canAccessUsers') : defaultPermissions.canAccessUsers,
    },
    {
      href: '/admin/products',
      label: 'Productos',
      active: pathname === '/admin/products',
      show: hasValidUserRole ? hasPermission(user, 'canAccessProducts') : defaultPermissions.canAccessProducts,
    },
    {
      href: '/admin/pedidos',
      label: 'Pedidos',
      active: pathname === '/admin/pedidos',
      show: hasValidUserRole ? hasPermission(user, 'canAccessOrders') : defaultPermissions.canAccessOrders,
    },
  ];

  // Filter visible routes
  const visibleRoutes = routes.filter(route => route.show);

  return (
    <nav className={cn('items-center space-x-4 lg:space-x-6', className)}>
      {visibleRoutes.map((route) => (
        <Link
          key={route.href}
          href={route.href}
          className={cn(
            'text-sm font-medium transition-colors hover:text-primary',
            route.active ? 'text-black' : 'text-muted-foreground'
          )}
        >
          {route.label}
        </Link>
      ))}
    </nav>
  );
} 