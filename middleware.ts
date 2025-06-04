import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase URL or Anon Key in environment variables for middleware.');
    // Potentially return a response indicating server misconfiguration or just pass through
    return response;
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // If the request is mutated, clone it
          request.cookies.set({
            name,
            value,
            ...options,
          });
          // Update response cookies
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          // Update response cookies, setting value to empty and maxAge to 0 effectively deletes it
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  // Attempt to refresh the session if it exists and is expired
  // This will also make the user available throughout the application
  await supabase.auth.getUser();

  // Handle password reset-related URLs (your existing logic)
  const url = new URL(request.url);
  const pathname = url.pathname;
  const hash = url.hash; // Raw hash including '#'

  // Check for recovery or reset password flow (e.g., #type=recovery&access_token=...)
  if (hash && hash.includes('type=recovery')) {
    console.log('Recovery URL detected in middleware, redirecting to /reset-password with hash.');
    const resetUrl = new URL('/reset-password', request.url);
    resetUrl.hash = hash; // Preserve the full hash for the client-side
    return NextResponse.redirect(resetUrl);
  }

  // If the user lands on /reset-password and there's a hash, rewrite to ensure client gets it.
  // This is often for when the page is loaded directly with the recovery link hash.
  if (pathname === '/reset-password' && hash) {
    console.log('Reset password URL with hash detected in middleware, rewriting.');
    // Simply rewrite to the same path. The client-side code on /reset-password will handle the hash.
    return NextResponse.rewrite(request.url);
  }

  return response;
}

// Specify which routes this middleware applies to
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}; 