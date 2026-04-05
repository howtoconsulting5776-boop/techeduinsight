/**
 * Normalizes Supabase env vars (trim whitespace/BOM issues from .env)
 * and fails fast with a clear message when they are missing or invalid.
 */

function stripBom(s: string): string {
  return s.replace(/^\uFEFF/, '').trim()
}

function isLocalHttpHost(hostname: string): boolean {
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '::1'
  )
}

export function getSupabaseUrl(): string {
  const raw = stripBom(process.env.NEXT_PUBLIC_SUPABASE_URL ?? '')
  if (!raw) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL. Add it to .env.local in this Next.js app folder (values from Supabase → Project Settings → API).',
    )
  }
  const url = raw.replace(/\/+$/, '')
  try {
    const u = new URL(url)
    if (u.protocol === 'https:') {
      return url
    }
    if (u.protocol === 'http:' && isLocalHttpHost(u.hostname)) {
      return url
    }
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL must use https:// (http://은 localhost·127.0.0.1 로컬 Supabase만 허용)',
    )
  } catch (e) {
    if (e instanceof TypeError) {
      throw new Error(`Invalid NEXT_PUBLIC_SUPABASE_URL: ${raw}`)
    }
    throw e
  }
}

export function getSupabaseAnonKey(): string {
  const key = stripBom(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '')
  if (!key) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_ANON_KEY. Copy the anon public key from Supabase → Project Settings → API.',
    )
  }
  return key
}
