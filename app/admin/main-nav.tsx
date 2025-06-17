'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { User } from '@/lib/types';
import { hasPermission } from '@/lib/auth';

interface MainNavProps {
  className?: string;
  user: User | null;
}

export function MainNav({ className, user }: MainNavProps) {
  const pathname = usePathname();

  const routes = [
    {
      href: '/',
      label: 'Inicio',
      active: pathname === '/',
      show: true,
    },
    {
      href: '/admin/users',
      label: 'Usuarios',
      active: pathname === '/admin/users',
      show: hasPermission(user, 'canAccessUsers'),
    },
    {
      href: '/admin/products',
      label: 'Productos',
      active: pathname === '/admin/products',
      show: hasPermission(user, 'canAccessProducts'),
    },
    {
      href: '/admin/pedidos',
      label: 'Pedidos',
      active: pathname === '/admin/pedidos',
      show: hasPermission(user, 'canAccessOrders'),
    },
  ];

  return (
    <nav className={cn('flex items-center space-x-4 lg:space-x-6', className)}>
      {routes.map((route) => {
        if (!route.show) return null;
        
        return (
          <Link
            key={route.href}
            href={route.href}
            className={cn(
              'text-base font-semibold transition-colors hover:text-black',
              route.active ? 'text-black' : 'text-neutral-600'
            )}
          >
            {route.label}
          </Link>
        );
      })}
    </nav>
  );
}
