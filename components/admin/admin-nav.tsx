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
      <div className='max-w-7xl mx-auto flex items-center justify-between h-20 px-4 sm:px-6'>
        {/* Logo */}
        <Link href='/' className='flex items-center flex-shrink-0 h-full py-2'>
          <div className="relative h-full aspect-[3/1]">
          <Image
              src='/images/logo2.png'
            alt='Logo'
              fill
              className='object-contain'
            priority
          />
          </div>
        </Link>

        {/* Desktop Navigation - Hidden on mobile */}
        <nav className='hidden lg:flex flex-1 justify-center'>
          <MainNav className='flex gap-8' user={safeUser} />
        </nav>

        {/* Right Section - Menu for mobile, always visible */}
        <div className='flex items-center'>
          <Menu user={safeUser} isAdminPage={true} />
        </div>
      </div>
    </header>
  );
} 