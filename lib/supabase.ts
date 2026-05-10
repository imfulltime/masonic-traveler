import { createBrowserClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.warn('Supabase credentials not found. Some features may not work.');
}

// Browser client — uses cookies (via @supabase/ssr) so sessions are
// shared with the Next.js middleware. Without this, the middleware
// can't see the auth session and redirects authenticated users to /login.
export const supabase = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);

// Server-side admin client — service role key, no session persistence.
// Uses the regular createClient since this is server-only and doesn't need cookies.
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE || '';

export const supabaseAdmin = serviceRoleKey && process.env.NEXT_PUBLIC_SUPABASE_URL
  ? createClient<Database>(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )
  : null;
