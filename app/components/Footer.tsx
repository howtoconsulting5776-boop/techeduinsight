import Link from 'next/link'

const FOOTER_LINKS = [
  { href: '/about', label: '서비스 소개' },
  { href: '/news', label: '뉴스·공지' },
  { href: '/insights', label: '인사이트' },
  { href: '/lectures', label: '강의' },
] as const

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-white/10 bg-brand-navy py-10 text-sm text-white/90">
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 px-4 text-center">
        <nav aria-label="푸터">
          <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            {FOOTER_LINKS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-white/88 underline-offset-4 transition-colors hover:text-white hover:underline"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div>
          <p className="font-medium tracking-tight text-white">TechEdu Insight</p>
          <p className="mt-1 text-xs text-white/65">© {new Date().getFullYear()}</p>
        </div>
      </div>
    </footer>
  )
}
