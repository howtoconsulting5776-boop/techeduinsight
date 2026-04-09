import Link from 'next/link'
import { LandingSectionHeader } from '@/app/components/landing/LandingSectionHeader'
import { buildPublicPageMetadata } from '@/app/lib/seo'

export const metadata = buildPublicPageMetadata({
  title: 'Edutech 서비스 소개 | TechEdu Insight',
  description:
    'TechEdu Insight는 Edutech·AI 기반 학습과 프로젝트 쇼케이스, 바이트코딩 강의를 한곳에서 제공합니다. 학원·입시·진로 준비에 맞춘 콘텐츠 허브입니다.',
  path: '/about',
  extraKeywords: ['서비스 소개', '온라인 학습', '프로젝트 기반 학습'],
  useTitleTemplate: false,
})

export default function AboutPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12 md:py-16">
      <LandingSectionHeader
        label="About"
        title="Edutech 서비스 소개"
        titleLevel="h1"
        description="TechEdu Insight가 제공하는 학습 경험과 가치를 요약합니다."
      />

      <div className="prose prose-neutral max-w-none dark:prose-invert">
        <p className="text-foreground leading-relaxed">
          <strong>TechEdu Insight</strong>는 에듀테크(Edutech) 관점에서{' '}
          <strong>AI·진로·입시</strong>에 관심 있는 학습자와 학원을 위한 플랫폼입니다. 공개 프로젝트
          쇼케이스로 결과물을 공유하고, <strong>바이트코딩·바이브코딩</strong> 스타일의 강의 카탈로그로
          실습 중심 학습을 이어갈 수 있습니다.
        </p>
        <p className="mt-4 text-foreground leading-relaxed">
          교육 인사이트(뉴스·기사 큐레이션)로 업계 동향을 빠르게 파악하고, 멤버십에 따라 프리미엄
          강의를 이용할 수 있습니다.
        </p>
      </div>

      <ul className="mt-10 space-y-3 text-sm text-muted-foreground">
        <li>
          <Link href="/lectures" className="font-medium text-brand-navy underline-offset-4 hover:underline">
            바이트코딩 강의 목록
          </Link>
        </li>
        <li>
          <Link href="/insights" className="font-medium text-brand-navy underline-offset-4 hover:underline">
            인사이트·뉴스성 큐레이션
          </Link>
        </li>
        <li>
          <Link href="/news" className="font-medium text-brand-navy underline-offset-4 hover:underline">
            뉴스·공지 허브
          </Link>
        </li>
        <li>
          <Link href="/" className="font-medium text-brand-navy underline-offset-4 hover:underline">
            메인 · 프로젝트 쇼케이스
          </Link>
        </li>
      </ul>
    </main>
  )
}
