import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

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

