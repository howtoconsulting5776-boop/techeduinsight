'use client'

import { Suspense, useActionState } from 'react'
import { useSearchParams } from 'next/navigation'
import { signInWithGoogle } from '@/app/auth/actions'
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

function LoginForm() {
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') ?? ''

  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    login as (state: ActionState, payload: FormData) => Promise<ActionState>,
    null,
  )

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">로그인</CardTitle>
          <CardDescription>
            TechEdu Insight 계정으로 로그인하세요
          </CardDescription>
        </CardHeader>

        <form action={formAction}>
          {redirectTo ? (
            <input type="hidden" name="redirectTo" value={redirectTo} />
          ) : null}
          <CardContent className="space-y-4">
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
          </CardContent>

          <CardFooter className="pb-2">
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? '로그인 중…' : '로그인'}
            </Button>
          </CardFooter>
        </form>

        <div className="flex items-center gap-2 px-6 pb-2">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">또는</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <CardFooter className="flex flex-col gap-3 pt-0">
          <form action={signInWithGoogle} className="w-full">
            <input type="hidden" name="next" value={redirectTo || '/dashboard'} />
            <Button type="submit" variant="outline" className="w-full">
              Google로 계속하기
            </Button>
          </form>
          <p className="text-center text-sm text-muted-foreground">
            계정이 없으신가요?{' '}
            <Link href="/signup" className="underline underline-offset-4 hover:text-primary">
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
