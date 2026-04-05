'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/app/lib/supabase/server'

function normalizeSiteUrl(raw: string | undefined): string {
  const t = raw?.trim().replace(/\/+$/, '') ?? ''
  return t
}

/**
 * OAuth `redirectTo` must exactly match an entry under Supabase → Authentication → URL Configuration
 * → Redirect URLs (same scheme + host + port). Using the browser URL can break if you open the app
 * as http://127.0.0.1:3000 but only http://localhost:3000/auth/callback is allowlisted.
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

  const callbackUrl = `${origin}/auth/callback?next=${encodeURIComponent(nextPath)}`

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
