import Link from 'next/link'
import { buildPublicPageMetadata } from '@/app/lib/seo'

export const metadata = buildPublicPageMetadata({
  title: '멤버십·이용 안내',
  description:
    'TechEdu Insight PREMIUM 멤버십 안내. 바이트코딩 강의·Edutech 학습 콘텐츠 이용을 위해 관리자에게 문의하세요.',
  path: '/pricing',
  extraKeywords: ['PREMIUM', '멤버십', '이용 안내'],
  useTitleTemplate: true,
})

export default function PricingPage() {
  return (
    <main className="flex min-h-[50vh] flex-col items-center justify-center bg-background px-4 py-16">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-bold tracking-tight">PREMIUM 멤버십이 필요합니다</h1>
        <p className="mt-4 leading-relaxed text-muted-foreground">
          이 콘텐츠는 유료 학습자(PREMIUM) 이상만 시청할 수 있습니다. 이용을 원하시면 관리자에게
          문의해 주세요.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/lectures"
            className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            강의 목록으로
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg border border-border bg-background px-5 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
          >
            메인으로 돌아가기
          </Link>
        </div>
      </div>
    </main>
  )
}
