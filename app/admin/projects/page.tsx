'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import {
  adminListProjects,
  adminDeleteProject,
  adminSetProjectPublished,
  adminSetProjectIframeAllowed,
  type AdminProjectRow,
} from '@/app/admin/actions'

const btnPrimary =
  'inline-flex items-center justify-center rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50'
const btnSecondary =
  'inline-flex items-center justify-center rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted disabled:opacity-50'
const btnOutline =
  'inline-flex items-center justify-center rounded-lg border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted disabled:opacity-50'
const btnDanger =
  'inline-flex items-center justify-center rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-1.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/20 disabled:opacity-50'

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<AdminProjectRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setError(null)
    const res = await adminListProjects()
    if (!res.ok) {
      setError(res.error)
      setProjects([])
    } else {
      setProjects(res.projects)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function setPublished(id: string, published: boolean) {
    setBusyId(id)
    setError(null)
    try {
      const res = await adminSetProjectPublished(id, published)
      if (!res.ok) {
        setError(res.error)
        return
      }
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : '요청에 실패했습니다.')
    } finally {
      setBusyId(null)
    }
  }

  async function toggleIframe(id: string, next: boolean) {
    setBusyId(id)
    setError(null)
    try {
      const res = await adminSetProjectIframeAllowed(id, next)
      if (!res.ok) {
        setError(res.error)
        return
      }
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : '요청에 실패했습니다.')
    } finally {
      setBusyId(null)
    }
  }

  async function handleDeleteProject(id: string) {
    if (!confirm('이 프로젝트를 삭제할까요? 되돌릴 수 없습니다.')) return
    setBusyId(id)
    setError(null)
    try {
      const res = await adminDeleteProject(id)
      if (!res.ok) {
        setError(res.error)
        return
      }
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : '요청에 실패했습니다.')
    } finally {
      setBusyId(null)
    }
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">불러오는 중…</p>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">프로젝트 심사</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          초안·공개 프로젝트를 한곳에서 관리합니다.
        </p>
      </div>

      {error ? (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="border-b border-border bg-muted/50">
            <tr>
              <th className="px-3 py-2 font-semibold">제목</th>
              <th className="px-3 py-2 font-semibold">작성자</th>
              <th className="px-3 py-2 font-semibold">상태</th>
              <th className="px-3 py-2 font-semibold">iframe</th>
              <th className="px-3 py-2 font-semibold">등록일</th>
              <th className="px-3 py-2 font-semibold">작업</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((p) => (
              <tr key={p.id} className="border-b border-border">
                <td className="px-3 py-2 font-medium">{p.title}</td>
                <td className="px-3 py-2 text-muted-foreground">
                  {p.owner_display_name ?? '—'}
                </td>
                <td className="px-3 py-2">
                  <span
                    className={
                      p.status === 'published'
                        ? 'rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800'
                        : 'rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800'
                    }
                  >
                    {p.status === 'published' ? '공개' : '초안'}
                  </span>
                </td>
                <td className="px-3 py-2">{p.iframe_allowed ? '허용' : '차단'}</td>
                <td className="px-3 py-2 text-muted-foreground">
                  {new Date(p.created_at).toLocaleDateString('ko-KR')}
                </td>
                <td className="space-x-2 px-3 py-2 whitespace-nowrap">
                  {p.status !== 'published' ? (
                    <button
                      type="button"
                      className={btnPrimary}
                      disabled={busyId === p.id}
                      onClick={() => void setPublished(p.id, true)}
                    >
                      {busyId === p.id ? '처리 중…' : '공개'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      className={btnSecondary}
                      disabled={busyId === p.id}
                      onClick={() => void setPublished(p.id, false)}
                    >
                      {busyId === p.id ? '처리 중…' : '비공개'}
                    </button>
                  )}
                  <button
                    type="button"
                    className={btnOutline}
                    disabled={busyId === p.id}
                    onClick={() => void toggleIframe(p.id, !p.iframe_allowed)}
                  >
                    {busyId === p.id
                      ? '처리 중…'
                      : `iframe ${p.iframe_allowed ? '차단' : '허용'}`}
                  </button>
                  <Link
                    href={`/dashboard/projects/${p.id}/edit`}
                    className={btnOutline + ' inline-block'}
                  >
                    내용 편집
                  </Link>
                  <button
                    type="button"
                    className={btnDanger}
                    disabled={busyId === p.id}
                    onClick={() => void handleDeleteProject(p.id)}
                  >
                    {busyId === p.id ? '처리 중…' : '삭제'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {projects.length === 0 ? (
        <p className="text-sm text-muted-foreground">프로젝트가 없습니다.</p>
      ) : null}
    </div>
  )
}
