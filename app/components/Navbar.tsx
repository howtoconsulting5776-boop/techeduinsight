'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { useSupabaseBrowser } from '@/app/components/SupabaseBrowserProvider'
import { logout } from '@/app/login/actions'
import { cn } from '@/lib/utils'

interface NavbarProps {
  initialUser?: User | null
}

type NavKey = 'showcase' | 'lectures' | 'insights' | 'dashboard'

const NAV_LINKS: Array<{
  href: string
  label: string
  key: NavKey
  requireAuth?: boolean
}> = [
  { href: '/insights', label: '인사이트', key: 'insights' },
  { href: '/showcase', label: '쇼케이스', key: 'showcase' },
  { href: '/lectures', label: '강의', key: 'lectures' },
  { href: '/dashboard', label: '대시보드', key: 'dashboard', requireAuth: true },
]

/**
 * 글로벌 네비게이션 (PRD: 네비게이션 일관성)
 * — 전 페이지 동일 항목, 활성 표시, 비로그인 시 대시보드 미노출
 */
function resolveActiveNav(pathname: string | null): NavKey | null {
  if (!pathname) return null
  if (pathname === '/showcase' || pathname.startsWith('/projects/')) return 'showcase'
  if (pathname.startsWith('/lectures') || pathname.startsWith('/watch/')) return 'lectures'
  if (pathname.startsWith('/insights')) return 'insights'
  if (pathname.startsWith('/dashboard')) return 'dashboard'
  return null
}

export default function Navbar({ initialUser = null }: NavbarProps) {
  const pathname = usePathname()
  const supabase = useSupabaseBrowser()
  const [user, setUser] = useState<User | null>(initialUser)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => sub.subscription.unsubscribe()
  }, [supabase])

  const closeMenu = () => setMenuOpen(false)
  const activeKey = resolveActiveNav(pathname)

  const linkBase =
    'rounded-lg px-3 py-2.5 text-sm font-medium transition-colors md:px-2.5 md:py-1.5'
  const linkInactive = 'text-muted-foreground hover:bg-muted hover:text-foreground'
  const linkActive = 'bg-brand-navy/12 font-semibold text-brand-navy'

  const visibleLinks = NAV_LINKS.filter((item) => !item.requireAuth || user)

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-background/90 backdrop-blur-md supports-[backdrop-filter]:bg-background/75">
      <div className="relative mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3.5">
        <Link
          href="/"
          className="shrink-0 text-lg font-bold tracking-tight text-brand-navy"
          onClick={closeMenu}
        >
          TechEdu Insight
        </Link>

        <button
          type="button"
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-brand-navy transition-colors hover:bg-muted md:hidden"
          aria-expanded={menuOpen}
          aria-label={menuOpen ? '메뉴 닫기' : '메뉴 열기'}
          onClick={() => setMenuOpen((v) => !v)}
        >
          {menuOpen ? (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>

        <div
          className={`absolute left-0 right-0 top-full z-40 flex flex-col gap-1 border-b bg-background px-4 py-3 shadow-md md:static md:flex md:flex-row md:items-center md:gap-1 md:border-0 md:bg-transparent md:p-0 md:shadow-none ${
            menuOpen ? 'flex' : 'hidden md:flex'
          }`}
        >
          <nav
            className="flex flex-col gap-1 md:flex-row md:items-center md:gap-1"
            aria-label="주요 메뉴"
          >
            {visibleLinks.map((item) => {
              const isActive = activeKey === item.key
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={cn(linkBase, isActive ? linkActive : linkInactive)}
                  onClick={closeMenu}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div className="mt-2 border-t border-border pt-2 md:mt-0 md:ml-2 md:border-t-0 md:border-l md:pl-2 md:pt-0">
            {user ? (
              <form action={logout}>
                <button
                  type="submit"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-left text-sm font-medium text-foreground transition-colors hover:bg-muted md:w-auto md:px-3 md:py-1.5"
                >
                  로그아웃
                </button>
              </form>
            ) : (
              <Link
                href="/login"
                className="block w-full rounded-lg bg-primary px-3 py-2.5 text-center text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 md:w-auto md:px-3 md:py-1.5"
                onClick={closeMenu}
              >
                로그인
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
