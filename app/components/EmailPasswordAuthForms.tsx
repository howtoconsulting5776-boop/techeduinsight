'use client'

import { useState, type FormEvent } from 'react'
import { useSupabaseBrowser } from '@/app/components/SupabaseBrowserProvider'
import { validateSignupDisplayName } from '@/app/lib/auth/display-name'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function mapSupabaseAuthError(message: string): string {
  const lower = message.toLowerCase()
  if (
    lower.includes('fetch failed') ||
    lower === 'failed to fetch' ||
    lower.includes('load failed') ||
    lower.includes('networkerror')
  ) {
    return (
      'Supabase에 연결하지 못했습니다. .env.local 값을 고친 뒤에는 개발 서버를 꼭 재시작하세요. ' +
      'URL·anon 키는 Supabase → Project Settings → API와 동일한지 확인하고, ' +
      '인터넷·VPN·방화벽도 점검하세요.'
    )
  }
  // Supabase Auth: 짧은 시간에 가입/인증 메일 요청이 많을 때 (개발 중 반복 테스트 시 흔함)
  if (
    lower.includes('rate limit') ||
    lower.includes('over_email_send_rate_limit') ||
    lower.includes('email rate limit')
  ) {
    return (
      '이메일·가입 요청이 너무 많아 Supabase에서 잠시 막혀 있습니다. 몇 분~1시간 뒤에 다시 시도하거나, ' +
      'Authentication → Providers → Email에서 Confirm email을 끄면 확인 메일이 줄어듭니다. ' +
      '(대시보드 Authentication → Rate Limits에서 한도 정보를 확인할 수 있습니다.)'
    )
  }
  if (
    lower.includes('invalid login credentials') ||
    lower.includes('invalid email or password') ||
    lower.includes('wrong password') ||
    lower.includes('invalid credentials')
  ) {
    return '이메일 또는 비밀번호가 올바르지 않습니다.'
  }
  if (
    lower.includes('email not confirmed') ||
    lower.includes('email address not confirmed')
  ) {
    return '이메일 인증을 완료한 뒤 다시 로그인해 주세요. 메일함의 확인 링크를 눌러 주세요.'
  }
  if (lower.includes('user is banned') || lower.includes('user banned')) {
    return '이 계정은 이용이 제한되어 있습니다.'
  }
  if (
    lower.includes('too many requests') ||
    lower.includes('too_many_requests') ||
    lower.includes('request rate limit')
  ) {
    return '시도 횟수가 너무 많습니다. 잠시 후 다시 시도해 주세요.'
  }
  if (lower.includes('signups not allowed') || lower.includes('signup disabled')) {
    return '현재 새 계정 가입이 허용되지 않습니다. 관리자에게 문의해 주세요.'
  }
  if (
    lower.includes('user already registered') ||
    lower.includes('already been registered') ||
    lower.includes('already registered')
  ) {
    return '이미 가입된 이메일입니다. 로그인해 주세요.'
  }
  return message
}

function safeRedirectPath(raw: string | null | undefined): string {
  const t = raw?.trim() || '/dashboard'
  return t.startsWith('/') && !t.startsWith('//') ? t : '/dashboard'
}

/** 서버 액션 대신 브라우저에서 로그인 — Node→Supabase fetch 실패(fetch failed) 회피 */
export function EmailPasswordLoginForm({ redirectTo = '' }: { redirectTo?: string }) {
  const supabase = useSupabaseBrowser()
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const nextPath = safeRedirectPath(redirectTo || null)

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    const email = (fd.get('email') as string)?.trim()
    const password = fd.get('password') as string
    if (!email || !password) {
      setError('이메일과 비밀번호를 입력하세요.')
      return
    }
    setPending(true)
    try {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password })
      if (err) {
        setError(mapSupabaseAuthError(err.message))
        return
      }
      // 전체 네비게이션으로 쿠키가 반드시 다음 요청(서버 액션·RSC)에 실리게 함
      window.location.assign(nextPath)
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-4">
        {error ? (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <div className="space-y-1.5">
          <Label htmlFor="login-email">이메일</Label>
          <Input
            id="login-email"
            name="email"
            type="email"
            placeholder="you@example.com"
            required
            autoComplete="email"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="login-password">비밀번호</Label>
          <Input
            id="login-password"
            name="password"
            type="password"
            placeholder="••••••••"
            required
            autoComplete="current-password"
          />
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? '로그인 중…' : '이메일로 로그인'}
      </Button>
    </form>
  )
}

export function EmailPasswordSignupForm({
  nextPath: nextPathProp,
  onNeedsEmailConfirmation,
}: {
  nextPath: string
  onNeedsEmailConfirmation: () => void
}) {
  const supabase = useSupabaseBrowser()
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const nextPath = safeRedirectPath(nextPathProp)

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    const email = (fd.get('email') as string)?.trim()
    const password = fd.get('password') as string
    const displayNameInput = (fd.get('displayName') as string) ?? ''
    const nameCheck = validateSignupDisplayName(displayNameInput)
    if (!nameCheck.ok) {
      setError(nameCheck.error)
      return
    }
    const displayName = nameCheck.value
    if (!email || !password) {
      setError('이메일과 비밀번호를 입력하세요.')
      return
    }
    if (password.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다.')
      return
    }
    setPending(true)
    try {
      const apiRes = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, displayName }),
      })
      const apiJson: { ok?: boolean; error?: string; message?: string } = await apiRes
        .json()
        .catch(() => ({}))

      if (apiRes.ok && apiJson.ok) {
        const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password })
        if (signInErr) {
          setError(mapSupabaseAuthError(signInErr.message))
          return
        }
        window.location.assign(nextPath)
        return
      }

      if (apiRes.status === 503 && apiJson.error === 'SERVICE_UNAVAILABLE') {
        const origin =
          typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
        const emailRedirectTo = `${origin}/auth/callback?next=${encodeURIComponent(nextPath)}`

        const { data, error: err } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo,
            data: { display_name: displayName },
          },
        })
        if (err) {
          setError(mapSupabaseAuthError(err.message))
          return
        }
        if (data.session) {
          window.location.assign(nextPath)
          return
        }
        onNeedsEmailConfirmation()
        return
      }

      if (typeof apiJson.error === 'string' && apiJson.error) {
        setError(mapSupabaseAuthError(apiJson.error))
        return
      }
      setError('가입에 실패했습니다.')
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-4">
        {error ? (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <div className="space-y-1.5">
          <Label htmlFor="signup-display-name">별명</Label>
          <Input
            id="signup-display-name"
            name="displayName"
            type="text"
            placeholder="쇼케이스에 표시될 이름"
            required
            minLength={2}
            maxLength={40}
            autoComplete="nickname"
          />
          <p className="text-xs text-muted-foreground">공개 프로젝트 카드에 &quot;by …&quot; 로 보입니다.</p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="signup-email">이메일</Label>
          <Input
            id="signup-email"
            name="email"
            type="email"
            placeholder="you@example.com"
            required
            autoComplete="email"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="signup-password">비밀번호</Label>
          <Input
            id="signup-password"
            name="password"
            type="password"
            placeholder="••••••••"
            required
            minLength={6}
            autoComplete="new-password"
          />
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? '가입 중…' : '이메일로 가입하기'}
      </Button>
    </form>
  )
}
