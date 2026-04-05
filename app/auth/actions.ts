'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/app/lib/supabase/server'

function normalizeSiteUrl(raw: string | undefined): string {
  return raw?.trim().replace(/\/+$/, '') ?? ''
}

function getConfiguredSiteOrigin(): string | null {
  const env = normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL)
  return env || null
}

async function getRequestOrigin(): Promise<string> {
  const h = await headers()
  const host = h.get('x-forwarded-host') ?? h.get('host')
  const proto = h.get('x-forwarded-proto') ?? 'http'
  if (host) return `${proto}://${host}`
  return getConfiguredSiteOrigin() ?? 'http://localhost:3000'
}

export async function signInWithGoogle(formData: FormData) {
  const supabase = await createClient()
  const origin = getConfiguredSiteOrigin() ?? (await getRequestOrigin())
  const nextRaw = (formData.get('next') as string | null)?.trim() || '/dashboard'
  const nextPath =
    nextRaw.startsWith('/') && !nextRaw.startsWith('//') ? nextRaw : '/dashboard'

  const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent(nextPath)}`

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo },
  })

  if (error || !data.url) {
    redirect('/login?error=oauth')
  }

  redirect(data.url)
}
