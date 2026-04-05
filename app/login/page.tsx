'use client'

import { Suspense, useActionState } from 'react'
import { useSearchParams } from 'next/navigation'
import { GoogleSignInForm } from '@/app/components/GoogleSignInForm'
import { login } from './actions'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

type ActionState = { error?: string } | null

function oauthMessage(code: string | null): string | null {
  if (code === 'oauth') {
    return (
      'Google 로그인이 거절되었습니다. Supabase → Authentication → URL Configuration에서 ' +
      '「Site URL」이 반드시 앱 주소여야 합니다 (https://xxx.supabase.co 로 두면 안 됩니다). ' +
      'Redirect URLs에 정확히 추가: http://localhost:3000/auth/callback (또는 사용 중인 도메인 동일). ' +
      '가능하면 http://localhost:3000/** 도 추가해 보세요. .env.local의 NEXT_PUBLIC_SITE_URL은 ' +
      '브라우저 주소창과 동일한 origin( localhost vs 127.0.0.1 구분 )으로 맞추세요.'
    )
  }
  return null
}

function LoginForm() {
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') ?? ''
  const oauthErr = oauthMessage(searchParams.get('error'))

  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    login as (state: ActionState, payload: FormData) => Promise<ActionState>,
    null,
  )

  const nextAfterGoogle = redirectTo || '/dashboard'

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <Card className="w-full max-w-sm">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">로그인</CardTitle>
          <CardDescription>
            Google 계정으로 바로 로그인하거나, 이메일로 로그인하세요.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {oauthErr ? (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {oauthErr}
            </p>
          ) : null}

          <GoogleSignInForm nextPath={nextAfterGoogle} />

          <div className="flex items-center gap-2 py-1">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">또는 이메일</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <form action={formAction}>
            {redirectTo ? (
              <input type="hidden" name="redirectTo" value={redirectTo} />
            ) : null}
            <div className="space-y-4">
              {state?.error && (
                <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {state.error}
                </p>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="email">이메일</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">비밀번호</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>

            <Button type="submit" className="mt-4 w-full" disabled={pending}>
              {pending ? '로그인 중…' : '이메일로 로그인'}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col gap-2 border-t pt-6">
          <p className="text-center text-sm text-muted-foreground">
            계정이 없으신가요?{' '}
            <Link
              href={redirectTo ? `/signup?next=${encodeURIComponent(redirectTo)}` : '/signup'}
              className="underline underline-offset-4 hover:text-primary"
            >
              회원가입
            </Link>
          </p>
          <Link
            href="/"
            className="text-center text-sm text-muted-foreground underline underline-offset-4 hover:text-primary"
          >
            홈으로 돌아가기
          </Link>
        </CardFooter>
      </Card>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-background px-4">
          <p className="text-sm text-muted-foreground">불러오는 중…</p>
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  )
}
