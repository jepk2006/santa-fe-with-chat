'use server';

import { supabase, supabaseAdmin } from '../supabase';
import { convertToPlainObject, formatError } from '../utils';
import { PAGE_SIZE } from '../constants';
import { revalidatePath } from 'next/cache';
import { updateUserSchema } from '../validators';
import { z } from 'zod';
import { convertToSnakeCase, handlePagination, handleSupabaseError } from './database.actions';
import { createClient } from '../supabase-server';
import { SUPABASE_TABLES } from '../constants';

// Get user by the ID
export async function getUserById(userId: string) {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw error;
  if (!data) throw new Error('User not found');
  return data;
}

// Get all the users
export async function getAllUsers() {
  const { data, error } = await supabaseAdmin.from('users').select('*');

  if (error) {
    throw error;
  }

  return { data };
}

// Create a new user
export async function createUser(userData: { 
  email: string; 
  password?: string;
  name: string; 
  phone_number?: string;
  role: 'admin' | 'user' 
}) {
  try {
    // Generate a random temporary password if none is provided
    const temporaryPassword = userData.password || 
      Array(20).fill(0).map(() => Math.random().toString(36).charAt(2)).join('');
    
    // First create the auth user with the temporary password
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: userData.email,
      password: temporaryPassword,
      email_confirm: true
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('Failed to create user');

    // Then add additional user data to the users table
    const { data, error } = await supabaseAdmin
      .from('users')
      .update({
        name: userData.name,
        phone_number: userData.phone_number || null,
        role: userData.role
      })
      .eq('id', authData.user.id)
      .select()
      .single();

    if (error) throw error;

    let message = 'User created successfully';
    
    // Generate a password reset link if no password was provided
    if (!userData.password) {
      try {
        // Get the full site URL from environment or use production URL
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://santafe.com.bo';
        
        // Generate the password reset link through Supabase
        const { data: resetData, error: resetError } = await supabaseAdmin.auth.admin.generateLink({
          type: 'recovery',
          email: userData.email,
          options: {
            // Redirect to our API callback handler instead of directly to reset-password
            redirectTo: `${siteUrl}/api/auth/callback`,
          }
        });

        if (resetError) {
          return {
            success: true,
            message: 'User created successfully, but failed to generate password reset link: ' + resetError.message,
            data
          };
        }

        if (!resetData || !resetData.properties || !resetData.properties.action_link) {
          return {
            success: true,
            message: 'User created successfully, but no password reset link was generated',
            data
          };
        }

        message = 'User created successfully. A password setup email has been sent.';

      } catch (resetError) {
        return {
          success: true,
          message: 'User created successfully, but failed to process the password reset: ' + 
                  (resetError instanceof Error ? resetError.message : 'Unknown error'),
          data
        };
      }
    }

    return {
      success: true,
      message,
      data
    };

  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to create user'
    };
  }
}

// Delete a user
export async function deleteUser(id: string) {
  try {
    // Use supabaseAdmin instead of supabase to have proper permissions
    const { error } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', id);

    if (error) throw error;
    
    // Also delete the auth user
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);
    
    if (authError) throw authError;

    revalidatePath('/admin/users');
    
    return {
      success: true,
      message: 'User deleted successfully',
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to delete user',
    };
  }
}

// Update a user
export async function updateUser(user: z.infer<typeof updateUserSchema>) {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .update({
        name: user.name,
        email: user.email,
        phone_number: user.phone_number || null,
        role: user.role,
      })
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/admin/users');
    return {
      success: true,
      message: 'User updated successfully',
      data,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update user',
    };
  }
}

export async function updateUserAddress(address: any) {
  const supabase = await createClient();

  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('Not authenticated');
  }

  const { error } = await supabase
    .from(SUPABASE_TABLES.USERS)
    .update({
      shipping_address: address,
    })
    .eq('id', session.user.id);

  if (error) {
    handleSupabaseError(error);
  }

  revalidatePath('/shipping-address');
}

// Simple user creation without password reset email (as a backup)
export async function createUserSimple(userData: { 
  email: string; 
  name: string; 
  phone_number?: string;
  role: 'admin' | 'user',
  password: string
}) {
  try {
    // Create the auth user with the provided password
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('Failed to create user');

    // Add additional user data to the users table
    const { data, error } = await supabaseAdmin
      .from('users')
      .update({
        name: userData.name,
        phone_number: userData.phone_number || null,
        role: userData.role
      })
      .eq('id', authData.user.id)
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/admin/users');
    
    return {
      success: true,
      message: 'User created successfully with password',
      data
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to create user'
    };
  }
}
