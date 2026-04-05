'use server'

import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/app/lib/supabase/server'
import {
  OAUTH_NEXT_COOKIE,
  OAUTH_NEXT_MAX_AGE_SEC,
} from '@/app/auth/oauth-cookie'

function normalizeSiteUrl(raw: string | undefined): string {
  const t = raw?.trim().replace(/\/+$/, '') ?? ''
  return t
}

/**
 * OAuth `redirectTo` must match Supabase → Authentication → URL Configuration → Redirect URLs.
 * Prefer NEXT_PUBLIC_SITE_URL so localhost vs 127.0.0.1 matches your allow list.
 */
function getConfiguredSiteOrigin(): string | null {
  const env = normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL)
  return env || null
}

async function getRequestOrigin(): Promise<string> {
  const h = await headers()
  const host = h.get('x-forwarded-host') ?? h.get('host')
  const proto = h.get('x-forwarded-proto') ?? 'http'
  if (host) return `${proto}://${host}`
  const fallback = getConfiguredSiteOrigin()
  if (fallback) return fallback
  return 'http://localhost:3000'
}

export async function signInWithGoogle(formData: FormData) {
  const supabase = await createClient()
  const configured = getConfiguredSiteOrigin()
  const origin = configured ?? (await getRequestOrigin())
  const nextRaw = (formData.get('next') as string | null)?.trim() || '/dashboard'
  const nextPath =
    nextRaw.startsWith('/') && !nextRaw.startsWith('//') ? nextRaw : '/dashboard'

  const cookieStore = await cookies()
  cookieStore.set(OAUTH_NEXT_COOKIE, nextPath, {
    path: '/',
    maxAge: OAUTH_NEXT_MAX_AGE_SEC,
    sameSite: 'lax',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
  })

  // No query string: easier to allowlist (e.g. exact http://localhost:3000/auth/callback)
  const callbackUrl = `${origin}/auth/callback`

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: callbackUrl,
      queryParams: {
        access_type: 'offline',
        prompt: 'select_account',
      },
    },
  })

  if (error || !data.url) {
    redirect('/login?error=oauth')
  }

  redirect(data.url)
}
