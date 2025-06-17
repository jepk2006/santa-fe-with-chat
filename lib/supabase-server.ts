import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Function to validate required environment variables
function validateEnvVars() {
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY'
  ];

  const missingVars = requiredVars.filter(
    varName => !process.env[varName]
  );

  if (missingVars.length > 0) {
    throw new Error(
      `Missing Supabase environment variables: ${missingVars.join(', ')}. ` +
      'Please set these in your environment or .env.local file.'
    );
  }
}

// This client is for use in Server Components and Pages
export const createClient = async () => {
  validateEnvVars();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const cookieStore = await cookies();

  return createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        }
      }
    }
  );
};

// This helper remains for explicit cookie operations in Server Actions / Route Handlers if needed for OTHER cookies.
// For Supabase auth cookies, prefer relying on the client above or the one for Server Actions.
export const handleCookieOperations = async (
  name: string,
  value: string | null,
  options: CookieOptions
) => {
  try {
    const cookieStore = await cookies();
    if (value === null) {
      cookieStore.delete({ name, ...options });
    } else {
      cookieStore.set(name, value, options);
    }
  } catch (error) {
  }
}; 