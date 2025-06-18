'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

export default function HashRedirector() {
  const router = useRouter();

  useEffect(() => {
    // This effect will only run in the browser
    if (typeof window === 'undefined') return;

    // Check if we have a hash that might contain auth tokens
    const hash = window.location.hash;
    if (!hash || hash.length <= 1) return;

    // Parse the hash parameters
    const params = new URLSearchParams(hash.substring(1));
    const accessToken = params.get('access_token');
    const type = params.get('type');

    if (accessToken) {
      // Create supabase client
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      // Set the session using the tokens from the hash
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: params.get('refresh_token') || '',
      }).then(({ error }) => {
        if (error) {
          console.error('Error setting session:', error);
          router.push('/auth/auth-code-error');
          return;
        }

        // Determine where to redirect based on the type
        if (type === 'signup' || type === 'email_change') {
          // Email confirmation - redirect to account page
          router.push('/account');
        } else if (type === 'recovery') {
          // Password reset - redirect to reset password page (if it exists)
          router.push('/account'); // For now, redirect to account until we create a password reset page
        } else {
          // Default case - redirect to account
          router.push('/account');
        }
      });
    }
  }, [router]);

  // This component doesn't render anything visible
  return null;
} 