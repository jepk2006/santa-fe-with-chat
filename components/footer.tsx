import Link from 'next/link';
import { APP_NAME } from '@/lib/constants';
import { createClient } from '@/lib/supabase-server';
import { Button } from '@/components/ui/button';
import LogoutButton from '@/components/auth/logout-button';

const Footer = async () => {
  const currentYear = new Date().getFullYear();
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    let isAdmin = false;

    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      isAdmin = profile?.role === 'admin';
    }

    return (
      <footer className='border-t'>
        <div className='container py-8 md:py-12 relative'>
          {!user && (
            <div className='absolute right-4 bottom-4'>
              <Button 
                asChild 
                variant='ghost' 
                className='bg-transparent hover:bg-secondary text-xs text-muted-foreground'
              >
                <Link href='/login'>
                  Staff Login
                </Link>
              </Button>
            </div>
          )}
          
          {user && (
            <div className='absolute right-4 bottom-4'>
              <LogoutButton />
            </div>
          )}
          
          <div className='mt-8 text-center text-sm text-muted-foreground'>
            <p>
              © {currentYear}. All rights reserved.
            </p>
            {isAdmin && (
              <p className='mt-2'>
                <Link
                  href='/admin'
                  className='text-primary hover:underline'
                >
                  Admin Dashboard
                </Link>
              </p>
            )}
          </div>
        </div>
      </footer>
    );
  } catch (error) {
    // Fallback footer without user-specific content
    return (
      <footer className='border-t'>
        <div className='container py-8 md:py-12'>
          <div className='mt-8 text-center text-sm text-muted-foreground'>
            <p>© {currentYear}. All rights reserved.</p>
            <div className='absolute right-4 bottom-4'>
              <Button 
                asChild 
                variant='ghost' 
                className='bg-transparent hover:bg-secondary text-xs text-muted-foreground'
              >
                <Link href='/login'>Staff Login</Link>
              </Button>
            </div>
          </div>
        </div>
      </footer>
    );
  }
};

export default Footer; 