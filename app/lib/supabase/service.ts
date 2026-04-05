import { createClient } from '@supabase/supabase-js'
import { getSupabaseUrl } from '@/app/lib/supabase/env'

/**
 * Server-only Supabase client with the service role key. Never import from client components.
 */
export function createServiceRoleClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  if (!key) {
    throw new Error(
      'Missing SUPABASE_SERVICE_ROLE_KEY. Required for video tokens and /api/auth/signup (이메일 확인 없이 가입).',
    )
  }
  return createClient(getSupabaseUrl(), key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
