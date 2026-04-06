import Link from 'next/link'
import type { EduInsight } from '@/app/lib/types'
import { InsightCard } from '@/app/components/insights/InsightCard'

interface Props {
  items: EduInsight[]
  title?: string
  showMoreLink?: boolean
  /** 목록 페이지에서 카테고리 칩 아래 등 */
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
    <section className={`mx-auto w-full max-w-6xl px-4 py-10 ${className}`}>
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-brand-navy">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            테크·교육 관련 외부 기사를 큐레이션합니다. 원문은 각 출처 사이트에서 확인할 수 있습니다.
          </p>
        </div>
        {showMoreLink ? (
          <Link
            href="/insights"
            className="shrink-0 text-sm font-medium text-brand-navy underline-offset-4 hover:underline"
          >
            더 보기
          </Link>
        ) : null}
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((insight) => (
          <InsightCard key={insight.id} insight={insight} />
        ))}
      </div>
    </section>
  )
}
