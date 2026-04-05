import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { fetchWithTimeout, PROXY_FETCH_TIMEOUT_MS } from '@/app/lib/supabase/fetch-timeout'
import { getSupabaseAnonKey, getSupabaseUrl } from '@/app/lib/supabase/env'

const proxyFetch = fetchWithTimeout(PROXY_FETCH_TIMEOUT_MS)

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    getSupabaseUrl(),
    getSupabaseAnonKey(),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
      global: {
        fetch: proxyFetch,
      },
    },
  )

  // Refresh session — required to keep the auth token alive.
  // 네트워크 실패 시 공개 페이지는 막지 않고 통과(보호 경로는 user 없으면 리다이렉트).
  let user = null
  try {
    const { data, error } = await supabase.auth.getUser()
    if (!error) user = data.user ?? null
    else if (process.env.NODE_ENV === 'development') {
      console.warn('[proxy] getUser:', error.message)
    }
  } catch (e) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[proxy] getUser failed:', e)
    }
  }

  const { pathname } = request.nextUrl

  const protectedPrefixes = ['/dashboard', '/watch', '/admin']
  const isProtected = protectedPrefixes.some((prefix) =>
    pathname.startsWith(prefix),
  )

  if (isProtected && !user) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return supabaseResponse
}
