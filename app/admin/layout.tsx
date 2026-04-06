import Link from 'next/link'
import { requireAdmin } from '@/app/lib/auth/admin'

const nav = [
  { href: '/admin/users', label: '사용자 관리' },
  { href: '/admin/videos', label: '영상 관리' },
  { href: '/admin/projects', label: '프로젝트 심사' },
  { href: '/admin/insights', label: '인사이트' },
  { href: '/admin/stats', label: '수강 현황' },
] as const

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireAdmin()

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="w-56 shrink-0 border-r border-border bg-muted/30 px-3 py-6">
        <Link
          href="/dashboard"
          className="mb-6 block px-2 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          ← 일반 대시보드
        </Link>
        <p className="mb-3 px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          관리자
        </p>
        <nav className="flex flex-col gap-1">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="min-w-0 flex-1 overflow-auto p-6">{children}</div>
    </div>
  )
}
