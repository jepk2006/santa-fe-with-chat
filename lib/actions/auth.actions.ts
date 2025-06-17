'use server';

import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { redirect } from 'next/navigation';
import { SUPABASE_ROLES } from '../constants';
import { User } from '../types';
import { supabaseAdmin } from '../supabase';
import { SUPABASE_TABLES } from '../constants';
import { sendConfirmationEmail } from '../email';

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
    // First, check if there's already an auth user with this email
    const { data: { users: existingAuthUsers }, error: authCheckError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (authCheckError) {
      return {
        success: false,
        error: 'Failed to check existing users. Please try again.'
      };
    }
    
    const existingAuthUser = existingAuthUsers?.find(user => user.email === userData.email);
    
    // Check if user already exists by email in our users table
    const { data: existingProfile, error: profileCheckError } = await supabaseAdmin
      .from(SUPABASE_TABLES.USERS)
      .select('id, email')
      .eq('email', userData.email)
      .maybeSingle();
      
    if (profileCheckError) {
      return {
        success: false,
        error: 'Failed to check existing users. Please try again.'
      };
    }
    
    // Handle different scenarios
    if (existingProfile && existingAuthUser) {
      // Complete user already exists
      return {
        success: false,
        error: 'An account with this email already exists. Please try logging in instead.'
      };
    }
    
    if (existingProfile && !existingAuthUser) {
      // Profile exists but no auth user (shouldn't happen, but clean it up)
      await supabaseAdmin.from(SUPABASE_TABLES.USERS).delete().eq('id', existingProfile.id);
    }
    
    if (!existingProfile && existingAuthUser) {
      // Auth user exists but no profile (orphaned auth user)
      await supabaseAdmin.auth.admin.deleteUser(existingAuthUser.id);
    }

    // Create new auth user with metadata
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: false, // User will need to confirm email
      phone: userData.phone || undefined,
      user_metadata: {
        display_name: userData.name,
        name: userData.name, // Also store as 'name' for compatibility
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

    // Double-check if this ID already exists (race condition protection)
    const { data: existingId } = await supabaseAdmin
      .from(SUPABASE_TABLES.USERS)
      .select('id')
      .eq('id', authData.user.id)
      .maybeSingle();
      
    if (existingId) {
      // Update auth user metadata for existing user
      await supabaseAdmin.auth.admin.updateUserById(
        authData.user.id,
        {
          phone: userData.phone || undefined,
          user_metadata: {
            display_name: userData.name,
            name: userData.name,
          }
        }
      );
      
      // ALSO update the users table with the new data
      const phoneNumber = userData.phone && userData.phone.trim() !== '' ? userData.phone.trim() : null;
      
      await supabaseAdmin
        .from(SUPABASE_TABLES.USERS)
        .update({
          name: userData.name,
          phone_number: phoneNumber,
        })
        .eq('id', authData.user.id);
        
      // Still generate and send confirmation email even if user exists
      const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'signup',
        email: userData.email,
        password: userData.password,
      });

      if (linkError || !linkData?.properties?.action_link) {
        return {
          success: true,
          message: 'Registration completed! However, we could not send a confirmation email. Please contact support.'
        };
      }

      const emailResult = await sendConfirmationEmail(
        userData.email,
        userData.name,
        linkData.properties.action_link
      );
      
      return {
        success: true,
        message: emailResult.message || 'Registration completed! Please check your email to confirm your account.'
      };
    }

    // Create the user profile using admin client (bypasses RLS)
    
    // Handle phone number properly - convert empty string to null
    const phoneNumber = userData.phone && userData.phone.trim() !== '' ? userData.phone.trim() : null;
    
    const profileData = {
      id: authData.user.id,
      email: userData.email,
      name: userData.name,
      phone_number: phoneNumber, // Use the processed phone number
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
      } else {
        return {
          success: true,
          message: 'Registration completed! Please check your email to confirm your account.'
        };
      }
      
      return {
        success: false,
        error: `Failed to create user profile: ${profileError.message}`
      };
    }

    // Generate confirmation link and send email
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'signup',
      email: userData.email,
      password: userData.password,
    });

    if (linkError) {
      return {
        success: true,
        message: 'Registration successful! However, we could not send a confirmation email. Please contact support.'
      };
    }

    if (linkData?.properties?.action_link) {
      const emailResult = await sendConfirmationEmail(
        userData.email,
        userData.name,
        linkData.properties.action_link
      );
      
      return {
        success: true,
        message: emailResult.message || 'Registration successful! Please check your email to confirm your account.'
      };
    } else {
      return {
        success: true,
        message: 'Registration successful! However, we could not generate a confirmation link. Please contact support.'
      };
    }

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Registration failed'
    };
  }
}

// Export the cleanup function so it can be called separately if needed
export async function cleanupAuthUsers() {
  return cleanupOrphanedAuthUsers();
}