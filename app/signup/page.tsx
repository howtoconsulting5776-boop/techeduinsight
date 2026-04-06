'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { EmailPasswordSignupForm } from '@/app/components/EmailPasswordAuthForms'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import Link from 'next/link'

function SignupForm() {
  const searchParams = useSearchParams()
  const nextPath = searchParams.get('next') ?? '/dashboard'
  const [pendingEmail, setPendingEmail] = useState(false)

  if (pendingEmail) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-10">
        <img
          src="/te-logo.png"
          width={48}
          height={48}
          alt="TechEdu Insight"
          className="mb-6 size-12 rounded-xl object-cover shadow-md ring-1 ring-black/5"
        />
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">이메일 확인이 필요합니다</CardTitle>
            <CardDescription>
              Supabase에서 이메일 확인이 켜져 있어 메일의 링크를 눌러야 로그인할 수 있습니다. 확인
              없이 바로 가입하려면 Supabase 대시보드 → Authentication → Providers → Email →
              <strong className="font-medium text-foreground"> Confirm email</strong> 을 끄세요.
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
          AI 프로젝트 공유 및 학습 플랫폼에 오신 것을 환영합니다.
        </p>
      </div>

      <Card className="w-full max-w-sm">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">회원가입</CardTitle>
          <CardDescription>이메일로 가입할 수 있습니다.</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <EmailPasswordSignupForm
            nextPath={nextPath}
            onNeedsEmailConfirmation={() => setPendingEmail(true)}
          />
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
