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
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-10">
      <div className="mb-8 flex w-full max-w-sm flex-col items-center text-center">
        <img
          src="/te-logo.png"
          width={56}
          height={56}
          alt="TechEdu Insight"
          className="mb-4 size-14 rounded-xl object-cover shadow-md ring-1 ring-black/5"
        />
        <h1 className="text-xl font-bold tracking-tight text-brand-navy">TechEdu Insight</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          AI 프로젝트 공유 및 학습 플랫폼입니다. 로그인하면 쇼케이스 둘러보기, 강의 시청, 내
          프로젝트 등록 등을 이용할 수 있습니다.
        </p>
      </div>

      <Card className="w-full max-w-sm">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">로그인</CardTitle>
          <CardDescription>이메일과 비밀번호로 로그인하세요.</CardDescription>
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
        <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-10">
          <img
            src="/te-logo.png"
            width={56}
            height={56}
            alt=""
            className="mb-6 size-14 rounded-xl object-cover opacity-90 ring-1 ring-black/5"
            aria-hidden
          />
          <p className="text-sm text-muted-foreground">불러오는 중…</p>
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  )
}
