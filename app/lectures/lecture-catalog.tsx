'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Lock } from 'lucide-react'
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

function formatDuration(sec: number | null): string {
  if (sec == null || sec <= 0) return '—'
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${s.toString().padStart(2, '0')}`
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
          <Link
            key={item.id}
            href={item.href}
            className={`group relative overflow-hidden rounded-xl border bg-card text-left shadow-sm transition-shadow hover:shadow-md ${
              item.locked ? 'opacity-95' : ''
            }`}
          >
            <div
              className={`relative flex h-36 items-center justify-center overflow-hidden bg-gradient-to-br from-slate-800 to-slate-600 ${
                item.locked ? 'brightness-[0.45]' : ''
              }`}
            >
              {item.thumbnailUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.thumbnailUrl}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : null}
              <div
                className={`relative z-[1] flex h-full w-full items-center justify-center ${
                  item.thumbnailUrl ? 'bg-black/35' : ''
                }`}
              >
                {item.locked ? (
                  <Lock className="size-10 text-white/90 drop-shadow-md" aria-hidden />
                ) : (
                  <span className="text-4xl font-bold text-white/30 drop-shadow-sm">▶</span>
                )}
              </div>
              {item.showPremiumBadge ? (
                <span className="absolute right-2 top-2 rounded bg-amber-500/90 px-2 py-0.5 text-xs font-semibold text-white">
                  PREMIUM
                </span>
              ) : null}
            </div>
            <div className="p-4">
              <h2 className="line-clamp-2 font-semibold text-card-foreground group-hover:underline">
                {item.title}
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {formatDuration(item.duration_sec)}
                {item.category ? ` · ${item.category}` : ''}
              </p>
              {!item.locked && item.progressPct != null && item.progressPct > 0 ? (
                <div className="mt-3">
                  <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                    <span>진도</span>
                    <span>{item.progressPct}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${Math.min(100, item.progressPct)}%` }}
                    />
                  </div>
                </div>
              ) : null}
            </div>
          </Link>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="py-16 text-center text-muted-foreground">이 카테고리에 강의가 없습니다.</p>
      ) : null}
    </div>
  )
}
