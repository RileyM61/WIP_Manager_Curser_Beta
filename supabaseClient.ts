import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl =
  (process.env.SUPABASE_URL as string | undefined) ?? '';
const supabaseAnonKey =
  (process.env.SUPABASE_ANON_KEY as string | undefined) ?? '';

let client: SupabaseClient | null = null;

if (supabaseUrl && supabaseAnonKey) {
  client = createClient(supabaseUrl, supabaseAnonKey);
} else {
  if (!supabaseUrl) {
    console.warn(
      '[supabaseClient] Missing environment variable `VITE_SUPABASE_URL`.'
    );
  }
  if (!supabaseAnonKey) {
    console.warn(
      '[supabaseClient] Missing environment variable `VITE_SUPABASE_ANON_KEY`.'
    );
  }
}

export const supabase = client;

export const isSupabaseConfigured = () => Boolean(client);

