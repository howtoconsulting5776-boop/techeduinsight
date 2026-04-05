/**
 * Normalizes Supabase env vars (trim whitespace/BOM issues from .env)
 * and fails fast with a clear message when they are missing or invalid.
 */
export function getSupabaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  if (!raw) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL. Add it to .env.local in this Next.js app folder (values from Supabase → Project Settings → API).',
    )
  }
  const url = raw.replace(/\/+$/, '')
  try {
    const u = new URL(url)
    if (u.protocol !== 'https:') {
      throw new Error('NEXT_PUBLIC_SUPABASE_URL must use https://')
    }
  } catch (e) {
    if (e instanceof TypeError) {
      throw new Error(`Invalid NEXT_PUBLIC_SUPABASE_URL: ${raw}`)
    }
    throw e
  }
  return url
}

export function getSupabaseAnonKey(): string {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  if (!key) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_ANON_KEY. Copy the anon public key from Supabase → Project Settings → API.',
    )
  }
  return key
}
