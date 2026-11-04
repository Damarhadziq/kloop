/**
 * Supabase Client Placeholder (Frontend-First Readiness)
 *
 * When ready to connect to Supabase backend:
 * 1. Install `@supabase/supabase-js`
 * 2. Configure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env.local`
 * 3. Replace the placeholder client below with `createClient(supabaseUrl, supabaseAnonKey)`
 */

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''

export const supabaseConfig = {
  url: supabaseUrl,
  anonKey: supabaseAnonKey,
} as const

export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('your-project-id'))
}

export const supabase = {
  isConfigured: isSupabaseConfigured(),
  url: supabaseUrl,
}

