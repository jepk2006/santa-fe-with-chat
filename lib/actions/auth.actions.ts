'use server';

import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { redirect } from 'next/navigation';
import { SUPABASE_ROLES } from '../constants';
import { User } from '../types';

// Create a server action for handling cookie operations
export async function handleCookieOperation(
  name: string,
  value: string | null,
  options: any
) {
  const cookieStore = await cookies();
  
  if (value === null) {
    cookieStore.delete({ name });
  } else {
    cookieStore.set({ name, value, ...options });
  }
}

// Create a server action for checking admin status
export async function checkAdminStatus() {
  const cookieStore = await cookies();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
        set(name, value, options) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name, options) {
          cookieStore.set({ name, value: '', ...options, maxAge: 0 });
        },
      },
    }
  );

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/login');
  }

  // Get the user's role and complete profile from the users table
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    console.error('Error fetching user profile:', profileError);
    redirect('/login');
  }

  // Check if the user is an admin
  if (profile.role !== SUPABASE_ROLES.ADMIN) {
    redirect('/');
  }

  // Return a properly formatted user object
  return {
    id: user.id,
    email: user.email || '',
    role: profile.role,
    created_at: user.created_at,
    updated_at: user.updated_at
  } as User;
} 