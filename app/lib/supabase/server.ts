import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { cache } from 'react'
import type { SupabaseClient, User } from '@supabase/supabase-js'
import { fetchWithTimeout, SERVER_FETCH_TIMEOUT_MS } from '@/app/lib/supabase/fetch-timeout'
import { getSupabaseAnonKey, getSupabaseUrl } from '@/app/lib/supabase/env'

const serverFetch = fetchWithTimeout(SERVER_FETCH_TIMEOUT_MS)

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          )
        } catch {
          // setAll called from a Server Component — cookies can only be
          // mutated inside Server Actions or Route Handlers, so we ignore
          // this error safely.
        }
      },
    },
    global: {
      fetch: serverFetch,
    },
  })
}

/**
 * 한 번의 RSC 요청에서 layout·page가 각각 getUser() 하면 Supabase Auth가 두 번 호출된다.
 * React cache 로 한 번만 호출해 타임아웃·락 경합을 줄인다.
 */
export const getCachedSupabaseAuth = cache(
  async (): Promise<{ supabase: SupabaseClient; user: User | null }> => {
    const supabase = await createClient()
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()
      if (error && process.env.NODE_ENV === 'development') {
        console.warn('[supabase] getUser:', error.message)
      }
      return { supabase, user: user ?? null }
    } catch (e) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[supabase] getUser threw:', e)
      }
      return { supabase, user: null }
    }
  },
)
