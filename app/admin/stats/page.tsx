'use client'

import { useCallback, useEffect, useState } from 'react'
import { adminLoadStats, type AdminStatsPayload } from '@/app/admin/actions'

const cardClass =
  'rounded-xl border border-border bg-card p-5 shadow-sm'

export default function AdminStatsPage() {
  const [stats, setStats] = useState<AdminStatsPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setError(null)
    const res = await adminLoadStats()
    if (!res.ok) {
      setError(res.error)
      setStats(null)
    } else {
      setStats(res.stats)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  if (loading) {
    return <p className="text-sm text-muted-foreground">불러오는 중…</p>
  }

  if (error || !stats) {
    return (
      <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
        {error ?? '데이터를 불러올 수 없습니다.'}
      </p>
    )
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold">수강 현황</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          회원·콘텐츠 규모와 영상별 평균 진도율입니다.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className={cardClass}>
          <p className="text-xs font-medium uppercase text-muted-foreground">전체 회원</p>
          <p className="mt-2 text-3xl font-bold tabular-nums">{stats.totalMembers}</p>
        </div>
        <div className={cardClass}>
          <p className="text-xs font-medium uppercase text-muted-foreground">PREMIUM 회원</p>
          <p className="mt-2 text-3xl font-bold tabular-nums">{stats.premiumMembers}</p>
        </div>
        <div className={cardClass}>
          <p className="text-xs font-medium uppercase text-muted-foreground">전체 프로젝트</p>
          <p className="mt-2 text-3xl font-bold tabular-nums">{stats.totalProjects}</p>
        </div>
        <div className={cardClass}>
          <p className="text-xs font-medium uppercase text-muted-foreground">전체 강의</p>
          <p className="mt-2 text-3xl font-bold tabular-nums">{stats.totalVideos}</p>
        </div>
      </div>

      <section>
        <h2 className="mb-4 text-lg font-semibold">영상별 평균 진도율</h2>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="border-b border-border bg-muted/50">
              <tr>
                <th className="px-3 py-2 font-semibold">강의 제목</th>
                <th className="px-3 py-2 font-semibold">수강자 수</th>
                <th className="px-3 py-2 font-semibold">평균 진도율 (%)</th>
              </tr>
            </thead>
            <tbody>
              {stats.videoProgress.map((row) => (
                <tr key={row.videoId} className="border-b border-border">
                  <td className="px-3 py-2 font-medium">{row.title}</td>
                  <td className="px-3 py-2 tabular-nums">{row.learners}</td>
                  <td className="px-3 py-2 tabular-nums">{row.avgProgress}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {stats.videoProgress.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">등록된 강의가 없습니다.</p>
        ) : null}
      </section>
    </div>
  )
}
