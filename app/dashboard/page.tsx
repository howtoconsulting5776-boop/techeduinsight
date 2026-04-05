import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/app/lib/supabase/server'
import { logout } from '@/app/login/actions'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

const ROLE_LABELS: Record<string, string> = {
  GUEST: '게스트',
  MEMBER: '일반 회원',
  PREMIUM: '프리미엄 회원',
  TEACHER: '강사',
  ADMIN: '관리자',
}

const ROLE_COLORS: Record<string, string> = {
  GUEST: 'bg-gray-100 text-gray-700',
  MEMBER: 'bg-blue-100 text-blue-700',
  PREMIUM: 'bg-amber-100 text-amber-700',
  TEACHER: 'bg-green-100 text-green-700',
  ADMIN: 'bg-red-100 text-red-700',
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, role, avatar_url, created_at')
    .eq('id', user.id)
    .single()

  const displayName = profile?.display_name ?? user.email ?? '알 수 없음'
  const role = (profile?.role as string) ?? 'MEMBER'
  const joinedAt = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '-'

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">대시보드</CardTitle>
          <CardDescription>내 계정 정보</CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            {profile?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar_url}
                alt={displayName}
                className="h-14 w-14 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-2xl font-semibold uppercase">
                {displayName.charAt(0)}
              </div>
            )}
            <div>
              <p className="text-lg font-semibold">{displayName}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>

          {/* Role badge */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">역할</span>
            <span
              className={`rounded-full px-3 py-0.5 text-xs font-semibold ${ROLE_COLORS[role] ?? ROLE_COLORS.MEMBER}`}
            >
              {ROLE_LABELS[role] ?? role}
            </span>
          </div>

          {/* Joined date */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">가입일</span>
            <span className="text-sm">{joinedAt}</span>
          </div>

          {/* Navigation */}
          <div className="grid grid-cols-2 gap-2">
            <Link
              href="/dashboard/projects"
              className="inline-flex w-full items-center justify-center rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted"
            >
              내 프로젝트
            </Link>
            <Link
              href="/dashboard/projects/new"
              className="inline-flex w-full items-center justify-center rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              새 프로젝트 등록
            </Link>
          </div>

          {role === 'ADMIN' && (
            <Link
              href="/admin/users"
              className="inline-flex w-full items-center justify-center rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
            >
              관리자 대시보드
            </Link>
          )}

          {/* Logout */}
          <form action={logout}>
            <Button variant="outline" className="w-full" type="submit">
              로그아웃
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
