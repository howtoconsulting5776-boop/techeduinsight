import Link from 'next/link'
import { LectureCardLink } from '@/app/components/lectures/LectureCardLink'
import { LandingSectionHeader } from '@/app/components/landing/LandingSectionHeader'
import type { LectureListItem } from '@/app/lectures/lecture-catalog'

export function RecentLecturesSection({ items }: { items: LectureListItem[] }) {
  if (items.length === 0) return null

  return (
    <section aria-label="최근 강의" className="border-t border-border bg-background">
      <div className="mx-auto w-full max-w-6xl px-4 py-14 md:py-20">
        <LandingSectionHeader
          label="Lectures"
          title="최근 강의"
          description="최근에 등록된 강의입니다. 전체 카탈로그와 카테고리 필터는 강의 페이지에서 이용할 수 있습니다."
          actions={
            <Link
              href="/lectures"
              className="inline-flex items-center justify-center rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              강의 전체 보기
            </Link>
          }
        />
        <div className="mx-auto flex max-w-2xl flex-col gap-4">
          {items.map((item) => (
            <LectureCardLink key={item.id} item={item} />
          ))}
        </div>
      </div>
    </section>
  )
}
