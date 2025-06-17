import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { User } from './types';

// Get the current authenticated user
export async function getCurrentUser() {
  const cookieStore = await cookies();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name: string) {
          const cookie = cookieStore.get(name);
          return cookie?.value;
        },
        async set(name: string, value: string, options: any) {
          // We can't set cookies directly here outside of a Server Action or Route Handler
          // This function will be called by Supabase Auth, but we won't actually set cookies
          // The cookies will be handled automatically by the Supabase client
          return;
        },
        async remove(name: string, options: any) {
          // Same as above - we can't remove cookies here
          // This is just a placeholder for the Supabase Auth API
          return;
        },
      },
    }
  );

  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return null;
    }

    // Get the user's role from the users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (userError) {
      return null;
    }

    if (!userData) {
      return null;
    }

    return {
      id: user.id,
      email: user.email!,
      role: userData.role,
      created_at: user.created_at,
      updated_at: user.updated_at,
    } as User;
  } catch (error) {
    return null;
  }
} 