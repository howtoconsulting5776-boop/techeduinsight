import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/app/lib/supabase/service'

const WINDOW_MS = 15 * 60 * 1000
const MAX_PER_WINDOW = 10

const buckets = new Map<string, number[]>()

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const cutoff = now - WINDOW_MS
  let times = buckets.get(ip) ?? []
  times = times.filter((t) => t > cutoff)
  if (times.length >= MAX_PER_WINDOW) {
    buckets.set(ip, times)
    return true
  }
  times.push(now)
  buckets.set(ip, times)
  return false
}

function clientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  if (forwarded) return forwarded
  const real = request.headers.get('x-real-ip')?.trim()
  if (real) return real
  return 'unknown'
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

/**
 * 서비스 롤로 사용자 생성(email_confirm: true) → 확인 메일 없음 → 이메일 rate limit 회피.
 * 클라이언트는 이어서 signInWithPassword로 세션을 맺습니다.
 */
export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 })
  }

  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 })
  }

  const o = body as { email?: unknown; password?: unknown }
  const email = typeof o.email === 'string' ? o.email.trim() : ''
  const password = typeof o.password === 'string' ? o.password : ''

  if (!email || !password) {
    return NextResponse.json({ error: '이메일과 비밀번호를 입력하세요.' }, { status: 400 })
  }
  if (password.length < 6) {
    return NextResponse.json({ error: '비밀번호는 6자 이상이어야 합니다.' }, { status: 400 })
  }
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: '이메일 형식이 올바르지 않습니다.' }, { status: 400 })
  }

  const ip = clientIp(request)
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.' },
      { status: 429 },
    )
  }

  let admin: ReturnType<typeof createServiceRoleClient>
  try {
    admin = createServiceRoleClient()
  } catch {
    return NextResponse.json(
      { error: 'SERVICE_UNAVAILABLE', message: 'SUPABASE_SERVICE_ROLE_KEY가 없습니다.' },
      { status: 503 },
    )
  }

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (error) {
    const msg = error.message.toLowerCase()
    if (
      msg.includes('already') ||
      msg.includes('registered') ||
      msg.includes('exists') ||
      msg.includes('duplicate')
    ) {
      return NextResponse.json(
        { error: '이미 가입된 이메일입니다. 로그인해 주세요.' },
        { status: 409 },
      )
    }
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  if (!data.user) {
    return NextResponse.json({ error: '가입에 실패했습니다.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true as const })
}
