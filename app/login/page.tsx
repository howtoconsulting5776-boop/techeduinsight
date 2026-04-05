'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { EmailPasswordLoginForm } from '@/app/components/EmailPasswordAuthForms'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import Link from 'next/link'

function loginErrorMessage(code: string | null): string | null {
  if (code === 'oauth') {
    return '로그인에 실패했습니다. 잠시 후 다시 시도해 주세요.'
  }
  return null
}

function LoginForm() {
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') ?? ''
  const authErr = loginErrorMessage(searchParams.get('error'))

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <Card className="w-full max-w-sm">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">로그인</CardTitle>
          <CardDescription>이메일로 로그인하세요.</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {authErr ? (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {authErr}
            </p>
          ) : null}

          <EmailPasswordLoginForm redirectTo={redirectTo} />
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
