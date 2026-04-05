'use client'

import { Suspense, useActionState } from 'react'
import { useSearchParams } from 'next/navigation'
import { GoogleSignInForm } from '@/app/components/GoogleSignInForm'
import { signup } from './actions'
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

type ActionState = { error?: string; success?: boolean } | null

function SignupForm() {
  const searchParams = useSearchParams()
  const nextPath = searchParams.get('next') ?? '/dashboard'

  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    signup as (state: ActionState, payload: FormData) => Promise<ActionState>,
    null,
  )

  if (state?.success) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">가입 요청 완료</CardTitle>
            <CardDescription>
              이메일로 확인 링크를 보냈습니다. 메일함을 확인한 뒤 로그인하세요. (이메일 확인을 끈
              프로젝트라면 바로 로그인할 수 있습니다.)
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Link
              href="/login"
              className="inline-flex w-full items-center justify-center rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground"
            >
              로그인으로 이동
            </Link>
          </CardFooter>
        </Card>
      </main>
    )
  }

  const loginHref =
    nextPath !== '/dashboard'
      ? `/login?redirectTo=${encodeURIComponent(nextPath)}`
      : '/login'

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <Card className="w-full max-w-sm">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">회원가입</CardTitle>
          <CardDescription>Google 또는 이메일로 가입할 수 있습니다.</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <GoogleSignInForm nextPath={nextPath} />

          <div className="relative py-2 text-center text-xs text-muted-foreground">
            <span className="bg-card relative z-10 px-2">또는 이메일로 가입</span>
            <span className="absolute inset-x-0 top-1/2 h-px bg-border" aria-hidden />
          </div>

          <form action={formAction}>
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
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>
            </div>

            <Button type="submit" className="mt-4 w-full" disabled={pending}>
              {pending ? '가입 중…' : '이메일로 가입하기'}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col gap-2 border-t pt-6">
          <p className="text-center text-sm text-muted-foreground">
            이미 계정이 있으신가요?{' '}
            <Link href={loginHref} className="underline underline-offset-4 hover:text-primary">
              로그인
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

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-background px-4">
          <p className="text-sm text-muted-foreground">불러오는 중…</p>
        </main>
      }
    >
      <SignupForm />
    </Suspense>
  )
}
