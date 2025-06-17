import { redirect } from 'next/navigation';
import { checkAdminStatus } from './actions/auth.actions';
import { User } from './types';

export async function authGuard(): Promise<User> {
  try {
    // Use the server action that can properly handle cookies
    const user = await checkAdminStatus();
    
    // Additional check to ensure we have a proper user object with role
    if (!user || !user.role || !user.id) {
      redirect('/login');
    }
    
    return user;
  } catch (error) {
    redirect('/login');
  }
}

export const requireAdmin = authGuard; 