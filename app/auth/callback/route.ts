import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createClient } from '@/app/lib/supabase/server'
import { OAUTH_NEXT_COOKIE } from '@/app/auth/oauth-cookie'

function safeNextPath(raw: string | null | undefined): string | null {
  if (raw == null || raw === '') return null
  const t = raw.trim()
  if (t.startsWith('/') && !t.startsWith('//')) return t
  return null
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const cookieStore = await cookies()

  const nextFromQuery = safeNextPath(url.searchParams.get('next'))
  const nextFromCookie = safeNextPath(cookieStore.get(OAUTH_NEXT_COOKIE)?.value)
  const nextPath = nextFromQuery ?? nextFromCookie ?? '/dashboard'

  const clearOAuthCookie = (res: NextResponse) => {
    res.cookies.set(OAUTH_NEXT_COOKIE, '', {
      path: '/',
      maxAge: 0,
    })
    return res
  }

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const res = NextResponse.redirect(new URL(nextPath, url.origin))
      return clearOAuthCookie(res)
    }
  }

  const res = NextResponse.redirect(new URL('/login?error=oauth', url.origin))
  return clearOAuthCookie(res)
}
