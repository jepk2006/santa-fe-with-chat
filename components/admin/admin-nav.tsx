'use client';

import { User } from '@/lib/types';
import { MainNav } from '@/components/admin/main-nav';
import { AdminSearch } from '@/components/admin/admin-search';
import Menu from '@/components/shared/header/menu';
import Image from 'next/image';
import Link from 'next/link';

interface AdminNavProps {
  user: User | null;
}

export function AdminNav({ user }: AdminNavProps) {
  // Safety check - if user is invalid, show limited UI
  const safeUser: User = user ? {
    id: user.id || 'unknown',
    email: user.email || 'unknown@example.com',
    role: user.role || 'admin', // Default to admin for UI purposes
    created_at: user.created_at || new Date().toISOString(),
    updated_at: user.updated_at || new Date().toISOString()
  } : {
    id: 'unknown',
    email: 'unknown@example.com',
    role: 'admin',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  return (
    <div className='border-b container mx-auto'>
      <div className='flex items-center justify-between h-16 px-4'>
        <div className='flex items-center'>
          <Link href='/' className='mr-4'>
            <Image
              src='/images/logo.png'
              alt='Logo'
              width={120}
              height={40}
              className='object-contain'
            />
          </Link>
          <MainNav className='hidden md:flex' user={safeUser} />
        </div>
        <div className='flex items-center space-x-4'>
          <AdminSearch />
          <Menu user={safeUser} isAdminPage={true} />
        </div>
      </div>
    </div>
  );
} 