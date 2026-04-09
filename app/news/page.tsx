import Link from 'next/link'
import { LandingSectionHeader } from '@/app/components/landing/LandingSectionHeader'
import { buildPublicPageMetadata } from '@/app/lib/seo'

export const metadata = buildPublicPageMetadata({
  title: '뉴스·공지 | TechEdu Insight',
  description:
    'TechEdu Insight의 Edutech·AI 학습 소식과 공지, 외부 기사 큐레이션(인사이트) 안내. 학원·입시·진로 관련 업데이트를 한곳에서 확인하세요.',
  path: '/news',
  extraKeywords: ['뉴스', '공지', '에듀 소식'],
  useTitleTemplate: false,
})

export default function NewsPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12 md:py-16">
      <LandingSectionHeader
        label="News"
        title="뉴스·공지"
        titleLevel="h1"
        description="플랫폼 소식과 교육 업계 인사이트로 연결되는 허브입니다."
      />

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <p className="text-foreground leading-relaxed">
          운영 공지·업데이트는 이 페이지에서 안내하고, <strong>외부 기사·칼럼 큐레이션</strong>은{' '}
          <Link href="/insights" className="font-medium text-brand-navy underline-offset-4 hover:underline">
            인사이트
          </Link>{' '}
          메뉴에서 지속적으로 업데이트합니다.
        </p>
        <p className="mt-4 text-sm text-muted-foreground">
          Edutech·AI·학원·입시·진로 관련 콘텐츠를 TechEdu Insight에서 함께 모읍니다.
        </p>
      </div>

      <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Link
          href="/insights"
          className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          인사이트 보기
        </Link>
        <Link
          href="/about"
          className="inline-flex items-center justify-center rounded-lg border border-border bg-background px-5 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
        >
          서비스 소개
        </Link>
      </div>
    </main>
  )
}
