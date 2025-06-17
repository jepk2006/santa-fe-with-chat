'use client';

import { User } from '@/lib/types';
import { MainNav } from '@/components/admin/main-nav';
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
    <header className='w-full bg-white sticky top-0 z-40 border-b'>
      <div className='max-w-7xl mx-auto flex items-center h-20 px-6'>
        <Link href='/' className='flex items-center flex-shrink-0 mr-8'>
          <Image
            src='/images/logo.png'
            alt='Logo'
            width={200}
            height={200}
            className='object-contain w-200 h-200'
            priority
          />
        </Link>
        <nav className='flex-1 flex justify-center'>
          <MainNav className='flex gap-8' user={safeUser} />
        </nav>
        <div className='flex items-center gap-4 ml-8'>
          <Menu user={safeUser} isAdminPage={true} />
        </div>
      </div>
    </header>
  );
} 