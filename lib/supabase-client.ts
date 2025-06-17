import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Ensure we create the client only once in the browser to avoid multiple GoTrueClient warnings
const globalWithSupabase = globalThis as unknown as { supabase?: SupabaseClient };

export const supabase =
  globalWithSupabase.supabase ??
  createBrowserClient(supabaseUrl, supabaseAnonKey);

if (!globalWithSupabase.supabase) {
  globalWithSupabase.supabase = supabase;
} 