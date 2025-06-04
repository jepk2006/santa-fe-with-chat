'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User } from '@/lib/types';
import { hasPermission } from '@/lib/auth';
import { cn } from '@/lib/utils';
import {
  Users,
  Package,
  ShoppingCart,
} from 'lucide-react';

interface SidebarProps {
  user: User;
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();

  const navigation = [
    {
      name: 'Usuarios',
      href: '/admin/users',
      icon: Users,
      show: hasPermission(user, 'canAccessUsers'),
    },
    {
      name: 'Productos',
      href: '/admin/products',
      icon: Package,
      show: hasPermission(user, 'canAccessProducts'),
    },
    {
      name: 'Pedidos',
      href: '/admin/pedidos',
      icon: ShoppingCart,
      show: hasPermission(user, 'canAccessOrders'),
    },
  ];

  return (
    <div className="w-64 bg-white border-r">
      <div className="h-16 flex items-center px-6 border-b">
        <h2 className="text-lg font-semibold">Panel de Control</h2>
      </div>
      <nav className="p-4 space-y-1">
        {navigation.map((item) => {
          if (!item.show) return null;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center px-4 py-2 text-sm font-medium rounded-md',
                pathname === item.href
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
} 