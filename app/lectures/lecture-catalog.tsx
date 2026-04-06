'use client'

import { useMemo, useState } from 'react'
import { LectureCardLink } from '@/app/components/lectures/LectureCardLink'
import type { VideoRole } from '@/app/lib/types'

export interface LectureListItem {
  id: string
  title: string
  category: string | null
  sort_order: number
  duration_sec: number | null
  required_role: VideoRole
  /** Public URL for custom lecture thumbnail, or null for default placeholder */
  thumbnailUrl: string | null
  href: string
  locked: boolean
  showPremiumBadge: boolean
  progressPct: number | null
}

export default function LectureCatalog({ items }: { items: LectureListItem[] }) {
  const categories = useMemo(() => {
    const set = new Set<string>()
    for (const i of items) {
      if (i.category?.trim()) set.add(i.category.trim())
    }
    return ['전체', ...[...set].sort((a, b) => a.localeCompare(b, 'ko'))]
  }, [items])

  const [tab, setTab] = useState('전체')

  const filtered = useMemo(() => {
    if (tab === '전체') return items
    return items.filter((i) => (i.category ?? '').trim() === tab)
  }, [items, tab])

  return (
    <div>
      <div className="mb-8 flex flex-wrap justify-center gap-2">
        {categories.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setTab(c)}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
              tab === c
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-muted/40 text-muted-foreground hover:bg-muted'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((item) => (
          <LectureCardLink key={item.id} item={item} />
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="py-16 text-center text-muted-foreground">이 카테고리에 강의가 없습니다.</p>
      ) : null}
    </div>
  )
}
