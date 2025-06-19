'use server';

import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { redirect } from 'next/navigation';
import { SUPABASE_ROLES } from '../constants';
import { User } from '../types';
import { supabaseAdmin } from '../supabase';
import { SUPABASE_TABLES } from '../constants';

// Helper function to clean up orphaned auth users
async function cleanupOrphanedAuthUsers() {
  try {
    // Get all auth users
    const { data: { users: authUsers }, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (authError || !authUsers) {
      return;
    }

    // Get all profile user IDs
    const { data: profiles, error: profileError } = await supabaseAdmin
      .from(SUPABASE_TABLES.USERS)
      .select('id');

    if (profileError) {
      return;
    }

    const profileIds = new Set(profiles?.map(p => p.id) || []);
    
    // Find auth users without profiles
    const orphanedAuthUsers = authUsers.filter(authUser => !profileIds.has(authUser.id));
    
    // Clean up orphaned auth users
    for (const orphanedUser of orphanedAuthUsers) {
      await supabaseAdmin.auth.admin.deleteUser(orphanedUser.id);
    }
  } catch (error) {
    // Silently handle error
  }
}

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

export async function registerUser(userData: {
  email: string;
  password: string;
  name: string;
  phone: string; // Remove the optional, it will be an empty string if not provided
}) {
  try {
    // Create new auth user with metadata
    const { data: authData, error: authError } = await supabaseAdmin.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://santafe.com.bo'}/api/auth/callback?next=/account`,
        data: {
          display_name: userData.name,
          name: userData.name,
          phone: userData.phone || undefined,
        }
      }
    });

    if (authError) {
      return {
        success: false,
        error: authError.message
      };
    }

    if (!authData.user) {
      return {
        success: false,
        error: 'Failed to create user account'
      };
    }

    // Create the user profile using admin client (bypasses RLS)
    const phoneNumber = userData.phone && userData.phone.trim() !== '' ? userData.phone.trim() : null;
    
    const profileData = {
      id: authData.user.id,
      email: userData.email,
      name: userData.name,
      phone_number: phoneNumber,
      role: 'user',
      created_at: new Date().toISOString(),
    };
    
    // Try updating first (in case a basic record was auto-created by Supabase)
    const updatePayload = {
      email: userData.email,
      name: userData.name,
      phone_number: phoneNumber,
      role: 'user',
      created_at: new Date().toISOString(),
    };
    
    const { error: updateError, data: updatedData } = await supabaseAdmin
      .from(SUPABASE_TABLES.USERS)
      .update(updatePayload)
      .eq('id', authData.user.id)
      .select();

    let profileError = updateError;
    let insertedData = updatedData;

    // If update failed because record doesn't exist, try insert/upsert
    if (updateError && (updateError.code === 'PGRST116' || updateError.message?.includes('no rows'))) {
      const { error: upsertError, data: upsertData } = await supabaseAdmin
        .from(SUPABASE_TABLES.USERS)
        .upsert(profileData, { onConflict: 'id' })
        .select();
        
      profileError = upsertError;
      insertedData = upsertData;
    }

    if (profileError) {
      // Only cleanup auth user if it's not a duplicate key error
      if (!profileError.message?.includes('duplicate key')) {
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      }
      
      return {
        success: false,
        error: `Failed to create user profile: ${profileError.message}`
      };
    }

    return {
      success: true,
      message: 'Registro exitoso! Por favor revisa tu correo para confirmar tu cuenta.'
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Registro fallido'
    };
  }
}

// Export the cleanup function so it can be called separately if needed
export async function cleanupAuthUsers() {
  return cleanupOrphanedAuthUsers();
}