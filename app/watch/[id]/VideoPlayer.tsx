'use client'

import { useEffect, useRef, useState } from 'react'

/** YouTube IFrame API state codes */
const YT_ENDED = 0
const YT_PLAYING = 1

interface YTPlayer {
  destroy(): void
  getCurrentTime(): number
  getDuration(): number
}

interface YTPlayerCtor {
  new (
    elementId: string,
    options: {
      videoId: string
      width?: string | number
      height?: string | number
      playerVars?: Record<string, number | string>
      events?: {
        onStateChange?: (e: { data: number; target: YTPlayer }) => void
      }
    },
  ): YTPlayer
}

function loadYouTubeApi(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()
  const w = window as Window & {
    YT?: { Player: YTPlayerCtor }
    onYouTubeIframeAPIReady?: () => void
  }
  if (w.YT?.Player) return Promise.resolve()

  return new Promise((resolve, reject) => {
    const prev = w.onYouTubeIframeAPIReady
    w.onYouTubeIframeAPIReady = () => {
      try {
        prev?.()
      } catch {
        /* ignore */
      }
      resolve()
    }
    const tag = document.createElement('script')
    tag.src = 'https://www.youtube.com/iframe_api'
    tag.async = true
    tag.onerror = () => reject(new Error('youtube_api_load_failed'))
    document.body.appendChild(tag)
  })
}

export interface VideoPlayerProps {
  streamToken: string
  videoRecordId: string
}

export default function VideoPlayer({ streamToken, videoRecordId }: VideoPlayerProps) {
  const [error, setError] = useState<string | null>(null)
  const [divId] = useState(
    () => `ytp-${typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : String(Math.random()).slice(2)}`,
  )
  const playerRef = useRef<YTPlayer | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSentPctRef = useRef(-1)

  const scheduleProgressSave = (pct: number) => {
    const rounded = Math.min(100, Math.max(0, Math.round(pct)))
    if (rounded === lastSentPctRef.current) return
    lastSentPctRef.current = rounded
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      void fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId: videoRecordId,
          progressPct: rounded,
        }),
      })
      debounceRef.current = null
    }, 3000)
  }

  useEffect(() => {
    let cancelled = false
    const w = window as Window & { YT?: { Player: YTPlayerCtor } }

    async function init() {
      try {
        const res = await fetch(
          `/api/stream?token=${encodeURIComponent(streamToken)}`,
          { cache: 'no-store' },
        )
        if (!res.ok) {
          if (!cancelled) setError('영상을 불러올 수 없습니다.')
          return
        }
        const data = (await res.json()) as { videoId?: string }
        if (!data.videoId || cancelled) return

        await loadYouTubeApi()
        if (cancelled || !w.YT?.Player) {
          if (!cancelled) setError('플레이어 API를 불러오지 못했습니다.')
          return
        }

        playerRef.current = new w.YT.Player(divId, {
          videoId: data.videoId,
          width: '100%',
          height: '100%',
          playerVars: { rel: 0, modestbranding: 1 },
          events: {
            onStateChange: (e) => {
              const t = e.target
              const dur = t.getDuration()
              const cur = t.getCurrentTime()
              if (dur > 0 && Number.isFinite(cur)) {
                scheduleProgressSave((cur / dur) * 100)
              }
              if (e.data === YT_ENDED) {
                scheduleProgressSave(100)
              }
              if (e.data === YT_PLAYING) {
                const t2 = e.target
                const d = t2.getDuration()
                const c = t2.getCurrentTime()
                if (d > 0 && Number.isFinite(c)) {
                  scheduleProgressSave((c / d) * 100)
                }
              }
            },
          },
        })
      } catch {
        if (!cancelled) setError('플레이어 초기화에 실패했습니다.')
      }
    }

    void init()

    return () => {
      cancelled = true
      if (debounceRef.current) clearTimeout(debounceRef.current)
      try {
        playerRef.current?.destroy()
      } catch {
        /* ignore */
      }
      playerRef.current = null
    }
  }, [streamToken, videoRecordId, divId])

  return (
    <div className="space-y-4">
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <div className="relative aspect-video w-full overflow-hidden rounded-xl border bg-black">
        <div id={divId} className="h-full min-h-[240px] w-full" />
      </div>
    </div>
  )
}
