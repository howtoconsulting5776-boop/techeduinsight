'use server'

import { headers } from 'next/headers'
import { createClient } from '@/app/lib/supabase/server'

async function getRequestOrigin(): Promise<string> {
  const h = await headers()
  const host = h.get('x-forwarded-host') ?? h.get('host')
  const proto = h.get('x-forwarded-proto') ?? 'http'
  if (host) return `${proto}://${host}`
  const env = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '')
  return env ?? 'http://localhost:3000'
}

export async function signup(
  _prevState: { error?: string; success?: boolean } | null,
  formData: FormData,
): Promise<{ error?: string; success?: boolean } | null> {
  const email = (formData.get('email') as string)?.trim()
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: '이메일과 비밀번호를 입력하세요.' }
  }

  if (password.length < 6) {
    return { error: '비밀번호는 6자 이상이어야 합니다.' }
  }

  const supabase = await createClient()
  const origin = await getRequestOrigin()
  const emailRedirectTo = `${origin}/auth/callback?next=${encodeURIComponent('/dashboard')}`

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo },
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}
