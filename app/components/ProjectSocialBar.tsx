'use client'

import { useEffect, useState, useTransition } from 'react'
import Link from 'next/link'
import { Heart, MessageCircle, Share2 } from 'lucide-react'
import { recordProjectShare, toggleProjectLike } from '@/app/projects/social-actions'

function absoluteDetailUrl(shareUrl: string, projectId: string): string {
  const path = (shareUrl.trim() || `/projects/${projectId}`).trim()
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const p = path.startsWith('/') ? path : `/${path}`
  return origin ? `${origin}${p}` : p
}

type Props = {
  projectId: string
  /**
   * 세부정보 페이지 URL (절대 또는 `/projects/...` 상대).
   * 비우면 `/projects/{projectId}` 로 클라이언트에서 절대 URL로 만듭니다.
   */
  shareUrl?: string
  commentsHref: string
  initialLikesCount: number
  initialLiked: boolean
  commentsCount: number
  compact?: boolean
}

export function ProjectSocialBar({
  projectId,
  shareUrl = '',
  commentsHref,
  initialLikesCount,
  initialLiked,
  commentsCount,
  compact = false,
}: Props) {
  const [likesCount, setLikesCount] = useState(initialLikesCount)
  const [liked, setLiked] = useState(initialLiked)
  const [pending, startTransition] = useTransition()
  const [shareHint, setShareHint] = useState<string | null>(null)
  const [likeError, setLikeError] = useState<string | null>(null)

  useEffect(() => {
    setLikesCount(initialLikesCount)
    setLiked(initialLiked)
  }, [initialLikesCount, initialLiked])

  function onLike(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setLikeError(null)
    const wasLiked = liked
    const prevCount = likesCount
    setLiked(!wasLiked)
    setLikesCount(wasLiked ? Math.max(0, prevCount - 1) : prevCount + 1)

    startTransition(async () => {
      const res = await toggleProjectLike(projectId)
      if (res.ok) {
        setLiked(res.liked)
        setLikesCount(res.likesCount)
      } else {
        setLiked(wasLiked)
        setLikesCount(prevCount)
        setLikeError(res.error)
      }
    })
  }

  async function onShare(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setShareHint(null)
    const url = absoluteDetailUrl(shareUrl, projectId)

    try {
      await navigator.clipboard.writeText(url)
    } catch {
      setShareHint('링크 복사에 실패했습니다. 브라우저에서 클립보드 권한을 확인해 주세요.')
      return
    }

    let usedShareSheet = false
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({
          title: 'TechEdu Insight',
          text: url,
          url,
        })
        usedShareSheet = true
      }
    } catch {
      /* 사용자 취소 등 — 이미 클립보드에 복사됨 */
    }

    void recordProjectShare(projectId, usedShareSheet ? 'native_share' : 'clipboard')
    setShareHint(
      usedShareSheet
        ? '세부정보 링크를 복사했습니다. 공유 시트에서 앱을 고르거나, 다른 곳에 붙여 넣어 주세요.'
        : '세부정보 페이지 링크를 복사했습니다. 카톡·메일 등 원하는 곳에 붙여 넣어 공유하세요.',
    )
    setTimeout(() => setShareHint(null), 4500)
  }

  const pad = compact ? 'px-3 py-2' : 'px-1 py-2'

  return (
    <div className={`border-b border-border bg-card ${pad}`} onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center gap-1 sm:gap-2">
        <button
          type="button"
          onClick={onLike}
          disabled={pending}
          className="inline-flex items-center gap-1 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
          aria-label={liked ? '좋아요 취소' : '좋아요'}
        >
          <Heart
            className={`size-6 sm:size-7 ${liked ? 'fill-red-500 text-red-500' : ''}`}
            fill={liked ? 'currentColor' : 'none'}
            strokeWidth={1.75}
          />
          <span className="min-w-[1.25rem] text-sm font-medium tabular-nums text-foreground">
            {likesCount}
          </span>
        </button>

        <Link
          href={commentsHref}
          className="inline-flex items-center gap-1 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          onClick={(e) => e.stopPropagation()}
          aria-label="댓글"
        >
          <MessageCircle className="size-6 sm:size-7" strokeWidth={1.75} />
          <span className="min-w-[1.25rem] text-sm font-medium tabular-nums text-foreground">
            {commentsCount}
          </span>
        </Link>

        <button
          type="button"
          onClick={onShare}
          className="ml-auto inline-flex items-center gap-1 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="세부정보 페이지 링크 복사 및 공유"
        >
          <Share2 className="size-6 sm:size-7" strokeWidth={1.75} />
        </button>
      </div>
      {likeError ? <p className="mt-1 text-xs text-destructive">{likeError}</p> : null}
      {shareHint ? <p className="mt-1 text-xs text-muted-foreground">{shareHint}</p> : null}
    </div>
  )
}
