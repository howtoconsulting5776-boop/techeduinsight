'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  adminListVideos,
  adminCreateVideo,
  adminUpdateVideo,
  adminDeleteVideo,
} from '@/app/admin/actions'
import type { Video } from '@/app/lib/types'
import type { VideoRole } from '@/app/lib/types'

const inputClass =
  'mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring'
const btnPrimary =
  'inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50'
const btnSecondary =
  'inline-flex items-center justify-center rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50'
const btnDanger =
  'inline-flex items-center justify-center rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-1.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/20 disabled:opacity-50'

type FormState = {
  title: string
  youtube_id: string
  category: string
  required_role: VideoRole
  sort_order: string
  duration_sec: string
}

const emptyForm: FormState = {
  title: '',
  youtube_id: '',
  category: '',
  required_role: 'MEMBER',
  sort_order: '0',
  duration_sec: '',
}

export default function AdminVideosPage() {
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<FormState>(emptyForm)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setError(null)
    const res = await adminListVideos()
    if (!res.ok) {
      setError(res.error)
      setVideos([])
    } else {
      setVideos(res.videos)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const sort = Number.parseInt(form.sort_order, 10)
    const dur =
      form.duration_sec.trim() === ''
        ? null
        : Number.parseInt(form.duration_sec, 10)
    const res = await adminCreateVideo({
      title: form.title,
      youtube_id: form.youtube_id,
      category: form.category.trim() || null,
      required_role: form.required_role,
      sort_order: Number.isFinite(sort) ? sort : 0,
      duration_sec: dur != null && Number.isFinite(dur) ? dur : null,
    })
    setBusy(false)
    if (!res.ok) {
      setError(res.error)
      return
    }
    setForm(emptyForm)
    void load()
  }

  function startEdit(v: Video) {
    setEditingId(v.id)
    setEditForm({
      title: v.title,
      youtube_id: v.youtube_id,
      category: v.category ?? '',
      required_role: v.required_role,
      sort_order: String(v.sort_order),
      duration_sec: v.duration_sec != null ? String(v.duration_sec) : '',
    })
  }

  async function saveEdit() {
    if (!editingId) return
    setBusy(true)
    setError(null)
    const sort = Number.parseInt(editForm.sort_order, 10)
    const dur =
      editForm.duration_sec.trim() === ''
        ? null
        : Number.parseInt(editForm.duration_sec, 10)
    const res = await adminUpdateVideo(editingId, {
      title: editForm.title,
      youtube_id: editForm.youtube_id,
      category: editForm.category.trim() || null,
      required_role: editForm.required_role,
      sort_order: Number.isFinite(sort) ? sort : 0,
      duration_sec: dur != null && Number.isFinite(dur) ? dur : null,
    })
    setBusy(false)
    if (!res.ok) {
      setError(res.error)
      return
    }
    setEditingId(null)
    void load()
  }

  async function handleDelete(id: string) {
    if (!confirm('이 영상을 삭제할까요?')) return
    setBusy(true)
    setError(null)
    const res = await adminDeleteVideo(id)
    setBusy(false)
    if (!res.ok) {
      setError(res.error)
      return
    }
    if (editingId === id) setEditingId(null)
    void load()
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">불러오는 중…</p>
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold">영상 관리</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          강의 목록에 노출되는 영상을 등록·수정·삭제합니다.
        </p>
      </div>

      {error ? (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold">새 영상 등록</h2>
        <form onSubmit={handleCreate} className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="font-medium">제목</span>
            <input
              className={inputClass}
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              required
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium">YouTube ID</span>
            <input
              className={inputClass}
              value={form.youtube_id}
              onChange={(e) => setForm((f) => ({ ...f, youtube_id: e.target.value }))}
              required
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium">카테고리</span>
            <input
              className={inputClass}
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium">필요 등급</span>
            <select
              className={inputClass}
              value={form.required_role}
              onChange={(e) =>
                setForm((f) => ({ ...f, required_role: e.target.value as VideoRole }))
              }
            >
              <option value="MEMBER">MEMBER</option>
              <option value="PREMIUM">PREMIUM</option>
            </select>
          </label>
          <label className="block text-sm">
            <span className="font-medium">순서</span>
            <input
              type="number"
              className={inputClass}
              value={form.sort_order}
              onChange={(e) => setForm((f) => ({ ...f, sort_order: e.target.value }))}
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium">길이(초)</span>
            <input
              type="number"
              className={inputClass}
              value={form.duration_sec}
              onChange={(e) => setForm((f) => ({ ...f, duration_sec: e.target.value }))}
            />
          </label>
          <div className="sm:col-span-2">
            <button type="submit" className={btnPrimary} disabled={busy}>
              등록
            </button>
          </div>
        </form>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold">등록된 영상</h2>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="border-b border-border bg-muted/50">
              <tr>
                <th className="px-3 py-2 font-semibold">제목</th>
                <th className="px-3 py-2 font-semibold">YouTube ID</th>
                <th className="px-3 py-2 font-semibold">카테고리</th>
                <th className="px-3 py-2 font-semibold">등급</th>
                <th className="px-3 py-2 font-semibold">순서</th>
                <th className="px-3 py-2 font-semibold">길이</th>
                <th className="px-3 py-2 font-semibold">작업</th>
              </tr>
            </thead>
            <tbody>
              {videos.map((v) =>
                editingId === v.id ? (
                  <tr key={v.id} className="border-b border-border bg-muted/20">
                    <td className="px-3 py-2">
                      <input
                        className="w-full rounded border border-input px-2 py-1 text-xs"
                        value={editForm.title}
                        onChange={(e) =>
                          setEditForm((f) => ({ ...f, title: e.target.value }))
                        }
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        className="w-full rounded border border-input px-2 py-1 text-xs"
                        value={editForm.youtube_id}
                        onChange={(e) =>
                          setEditForm((f) => ({ ...f, youtube_id: e.target.value }))
                        }
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        className="w-full rounded border border-input px-2 py-1 text-xs"
                        value={editForm.category}
                        onChange={(e) =>
                          setEditForm((f) => ({ ...f, category: e.target.value }))
                        }
                      />
                    </td>
                    <td className="px-3 py-2">
                      <select
                        className="w-full rounded border border-input px-2 py-1 text-xs"
                        value={editForm.required_role}
                        onChange={(e) =>
                          setEditForm((f) => ({
                            ...f,
                            required_role: e.target.value as VideoRole,
                          }))
                        }
                      >
                        <option value="MEMBER">MEMBER</option>
                        <option value="PREMIUM">PREMIUM</option>
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        className="w-16 rounded border border-input px-2 py-1 text-xs"
                        value={editForm.sort_order}
                        onChange={(e) =>
                          setEditForm((f) => ({ ...f, sort_order: e.target.value }))
                        }
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        className="w-16 rounded border border-input px-2 py-1 text-xs"
                        value={editForm.duration_sec}
                        onChange={(e) =>
                          setEditForm((f) => ({ ...f, duration_sec: e.target.value }))
                        }
                      />
                    </td>
                    <td className="space-x-2 px-3 py-2 whitespace-nowrap">
                      <button type="button" className={btnPrimary} onClick={saveEdit} disabled={busy}>
                        저장
                      </button>
                      <button
                        type="button"
                        className={btnSecondary}
                        onClick={() => setEditingId(null)}
                        disabled={busy}
                      >
                        취소
                      </button>
                    </td>
                  </tr>
                ) : (
                  <tr key={v.id} className="border-b border-border">
                    <td className="px-3 py-2 font-medium">{v.title}</td>
                    <td className="px-3 py-2 font-mono text-xs">{v.youtube_id}</td>
                    <td className="px-3 py-2">{v.category ?? '—'}</td>
                    <td className="px-3 py-2">{v.required_role}</td>
                    <td className="px-3 py-2">{v.sort_order}</td>
                    <td className="px-3 py-2">{v.duration_sec ?? '—'}</td>
                    <td className="space-x-2 px-3 py-2 whitespace-nowrap">
                      <button
                        type="button"
                        className={btnSecondary}
                        onClick={() => startEdit(v)}
                        disabled={busy}
                      >
                        수정
                      </button>
                      <button
                        type="button"
                        className={btnDanger}
                        onClick={() => void handleDelete(v.id)}
                        disabled={busy}
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
        {videos.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">등록된 영상이 없습니다.</p>
        ) : null}
      </section>
    </div>
  )
}
