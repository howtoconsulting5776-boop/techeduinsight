'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Lock } from 'lucide-react'
import type { LectureListItem } from '@/app/lectures/lecture-catalog'

function formatDuration(sec: number | null): string {
  if (sec == null || sec <= 0) return '—'
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function LectureCardLink({ item }: { item: LectureListItem }) {
  return (
    <Link
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
          <Image
            src={item.thumbnailUrl}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
            className="object-cover"
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
        <h2 className="line-clamp-2 font-semibold text-card-foreground group-hover:underline">{item.title}</h2>
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
  )
}
