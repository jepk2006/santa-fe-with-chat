import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create a version of the client that won't throw on import but will show helpful errors when used
function createSafeClient(url: string | undefined, key: string | undefined, errorMessage: string) {
  // If environment variables are missing, return a proxy that will throw only when methods are called
  if (!url || !key) {
    return new Proxy({} as ReturnType<typeof createClient>, {
      get: (target, prop) => {
        if (prop === 'isError') return true;
        if (typeof prop === 'string') {
          return () => {
            throw new Error(errorMessage);
          };
        }
        return undefined;
      }
    });
  }
  
  // If we have the environment variables, create a real client
  return createClient(url, key);
}

// Create a Supabase client with the anon key for client-side operations
export const supabase = createSafeClient(
  supabaseUrl, 
  supabaseAnonKey, 
  'Supabase client error: Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables'
);

// Create a Supabase client with the service role key for server-side operations
export const supabaseAdmin = createSafeClient(
  supabaseUrl, 
  supabaseServiceKey,
  'Supabase admin client error: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables'
);

// Create a client-side Supabase client that doesn't throw on import
export const supabaseClient = createSafeClient(
  supabaseUrl, 
  supabaseAnonKey,
  'Supabase client error: Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables'
); 