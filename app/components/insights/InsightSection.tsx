import Link from 'next/link'
import type { EduInsight } from '@/app/lib/types'
import { InsightCard } from '@/app/components/insights/InsightCard'
import { LandingSectionHeader } from '@/app/components/landing/LandingSectionHeader'

interface Props {
  items: EduInsight[]
  title?: string
  showMoreLink?: boolean
  className?: string
}

export function InsightSection({
  items,
  title = '교육 인사이트',
  showMoreLink = true,
  className = '',
}: Props) {
  if (items.length === 0) return null

  return (
    <div className={`mx-auto w-full max-w-6xl px-4 py-12 md:py-14 ${className}`}>
      <LandingSectionHeader
        label="Insights"
        title={title}
        description="테크·교육 이슈를 엄선해 소개합니다. 카드 이미지를 누르면 요약 전문을 볼 수 있습니다."
        actions={
          showMoreLink ? (
            <Link
              href="/insights"
              className="text-sm font-medium text-brand-navy underline-offset-4 transition-colors hover:text-brand-blue hover:underline"
            >
              더 보기
            </Link>
          ) : undefined
        }
      />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((insight) => (
          <InsightCard key={insight.id} insight={insight} />
        ))}
      </div>
    </div>
  )
}
