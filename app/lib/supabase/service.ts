import { createClient } from '@supabase/supabase-js'
import { getSupabaseUrl } from '@/app/lib/supabase/env'

/**
 * Server-only Supabase client with the service role key. Never import from client components.
 */
export function createServiceRoleClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  if (!key) {
    throw new Error(
      'Missing SUPABASE_SERVICE_ROLE_KEY. Required for server-side video token issuance.',
    )
  }
  return createClient(getSupabaseUrl(), key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
