'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  adminListInsights,
  adminUpsertInsight,
  adminDeleteInsight,
  adminSetInsightPublished,
  type AdminInsightRow,
} from '@/app/admin/insights/actions'

const inputClass =
  'mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring'
const btnPrimary =
  'inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50'
const btnSecondary =
  'inline-flex items-center justify-center rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50'
const btnDanger =
  'inline-flex items-center justify-center rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-1.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/20 disabled:opacity-50'

function toDatetimeLocalValue(iso: string) {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function formatRowDate(iso: string) {
  try {
    return new Date(iso).toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'short' })
  } catch {
    return iso
  }
}

export default function AdminInsightsPage() {
  const [insights, setInsights] = useState<AdminInsightRow[]>([])
  const [loading, setLoading] = useState(true)
  const [listError, setListError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [formBusy, setFormBusy] = useState(false)
  const [editing, setEditing] = useState<AdminInsightRow | null>(null)

  const load = useCallback(async () => {
    setListError(null)
    const res = await adminListInsights()
    if (!res.ok) {
      setListError(res.error)
      setInsights([])
    } else {
      setInsights(res.insights)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      void load()
    })
    return () => cancelAnimationFrame(id)
  }, [load])

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold">인사이트</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          외부 기사 링크를 등록합니다. 공개로 표시된 항목만 홈·인사이트 페이지에 노출됩니다.
        </p>
      </div>

      <section className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-lg font-semibold">{editing ? '항목 수정' : '새로 등록'}</h2>
        {editing ? (
          <button
            type="button"
            className="mt-2 text-sm text-muted-foreground underline-offset-4 hover:underline"
            onClick={() => {
              setEditing(null)
              setFormError(null)
            }}
          >
            새 항목으로 초기화
          </button>
        ) : null}
        <form
          key={editing?.id ?? 'new'}
          className="mt-4 space-y-4"
          onSubmit={async (e) => {
            e.preventDefault()
            setFormError(null)
            setFormBusy(true)
            const fd = new FormData(e.currentTarget)
            const res = await adminUpsertInsight(fd)
            setFormBusy(false)
            if (!res.ok) {
              setFormError(res.error)
              return
            }
            setEditing(null)
            ;(e.currentTarget as HTMLFormElement).reset()
            await load()
          }}
        >
          {formError ? (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{formError}</p>
          ) : null}
          {editing ? <input type="hidden" name="id" value={editing.id} /> : null}
          <div>
            <label className="text-sm font-medium">제목 *</label>
            <input name="title" className={inputClass} required defaultValue={editing?.title ?? ''} />
          </div>
          <div>
            <label className="text-sm font-medium">요약</label>
            <textarea
              name="summary"
              rows={3}
              className={inputClass}
              defaultValue={editing?.summary ?? ''}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium">출처명 *</label>
              <input
                name="source_name"
                className={inputClass}
                required
                defaultValue={editing?.source_name ?? ''}
              />
            </div>
            <div>
              <label className="text-sm font-medium">카테고리</label>
              <input
                name="category"
                className={inputClass}
                placeholder="예: 에듀테크"
                defaultValue={editing?.category ?? ''}
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">원문 URL *</label>
            <input
              name="source_url"
              type="url"
              className={inputClass}
              required
              placeholder="https://"
              defaultValue={editing?.source_url ?? ''}
            />
          </div>
          <div>
            <label className="text-sm font-medium">썸네일 이미지 URL</label>
            <input
              name="image_url"
              type="url"
              className={inputClass}
              placeholder="https:// (선택)"
              defaultValue={editing?.image_url ?? ''}
            />
          </div>
          <div>
            <label className="text-sm font-medium">태그 (쉼표 구분)</label>
            <input
              name="tags"
              className={inputClass}
              placeholder="AI, 입시"
              defaultValue={editing?.tags?.join(', ') ?? ''}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium">게시일시 *</label>
              <input
                name="published_at"
                type="datetime-local"
                className={inputClass}
                required
                defaultValue={editing ? toDatetimeLocalValue(editing.published_at) : ''}
              />
            </div>
            <div>
              <label className="text-sm font-medium">정렬 우선순위 (높을수록 위)</label>
              <input
                name="sort_priority"
                type="number"
                className={inputClass}
                defaultValue={editing?.sort_priority ?? 0}
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="is_published"
              defaultChecked={editing?.is_published ?? false}
              className="rounded border-input"
            />
            공개 (사이트에 표시)
          </label>
          <button type="submit" className={btnPrimary} disabled={formBusy}>
            {formBusy ? '저장 중…' : editing ? '수정 저장' : '등록'}
          </button>
        </form>
      </section>

      <section>
        <h2 className="text-lg font-semibold">목록</h2>
        {loading ? (
          <p className="mt-4 text-sm text-muted-foreground">불러오는 중…</p>
        ) : listError ? (
          <p className="mt-4 text-sm text-destructive">{listError}</p>
        ) : insights.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">등록된 항목이 없습니다.</p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="border-b border-border bg-muted/50">
                <tr>
                  <th className="px-3 py-2 font-medium">제목</th>
                  <th className="px-3 py-2 font-medium">출처</th>
                  <th className="px-3 py-2 font-medium">게시</th>
                  <th className="px-3 py-2 font-medium">공개</th>
                  <th className="px-3 py-2 font-medium">작업</th>
                </tr>
              </thead>
              <tbody>
                {insights.map((row) => (
                  <tr key={row.id} className="border-b border-border">
                    <td className="max-w-[220px] truncate px-3 py-2">{row.title}</td>
                    <td className="whitespace-nowrap px-3 py-2">{row.source_name}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">
                      {formatRowDate(row.published_at)}
                    </td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        className={btnSecondary}
                        disabled={busyId === row.id}
                        onClick={async () => {
                          setBusyId(row.id)
                          const res = await adminSetInsightPublished(row.id, !row.is_published)
                          setBusyId(null)
                          if (!res.ok) {
                            setListError(res.error)
                            return
                          }
                          await load()
                        }}
                      >
                        {row.is_published ? '비공개' : '공개'}
                      </button>
                    </td>
                    <td className="space-x-2 whitespace-nowrap px-3 py-2">
                      <button type="button" className={btnSecondary} onClick={() => setEditing(row)}>
                        수정
                      </button>
                      <button
                        type="button"
                        className={btnDanger}
                        disabled={busyId === row.id}
                        onClick={async () => {
                          if (!confirm('이 항목을 삭제할까요?')) return
                          setBusyId(row.id)
                          const res = await adminDeleteInsight(row.id)
                          setBusyId(null)
                          if (!res.ok) {
                            setListError(res.error)
                            return
                          }
                          if (editing?.id === row.id) setEditing(null)
                          await load()
                        }}
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
