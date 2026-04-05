'use client'

import { useActionState, useCallback, useEffect, useRef, useState } from 'react'
import { adminListVideos, adminDeleteVideo } from '@/app/admin/actions'
import { createLectureVideoAction, updateLectureVideoAction } from '@/app/admin/videos/actions'
import { getThumbnailUrl } from '@/app/lib/storage'
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

type ActionState = { error: string } | null

function thumbPreview(path: string | null | undefined): string | null {
  return getThumbnailUrl(path ?? null)
}

export default function AdminVideosPage() {
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const [createState, createAction, createPending] = useActionState<ActionState, FormData>(
    createLectureVideoAction,
    null,
  )
  const createFormRef = useRef<HTMLFormElement>(null)
  const prevCreatePending = useRef(false)

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

  useEffect(() => {
    if (prevCreatePending.current && !createPending && createState === null) {
      createFormRef.current?.reset()
      void load()
    }
    prevCreatePending.current = createPending
  }, [createPending, createState, load])

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
          강의 목록에 노출되는 영상을 등록·수정·삭제합니다. 카드 썸네일은 아래에서 이미지를 올리면 강의 페이지에
          표시됩니다.
        </p>
      </div>

      {error ? (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
      ) : null}

      <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold">새 영상 등록</h2>
        <form ref={createFormRef} action={createAction} encType="multipart/form-data" className="mt-4">
          {createState?.error ? (
            <p className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {createState.error}
            </p>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="font-medium">제목</span>
              <input className={inputClass} name="title" required />
            </label>
            <label className="block text-sm">
              <span className="font-medium">YouTube ID</span>
              <input className={inputClass} name="youtube_id" required />
            </label>
            <label className="block text-sm">
              <span className="font-medium">카테고리</span>
              <input className={inputClass} name="category" />
            </label>
            <label className="block text-sm">
              <span className="font-medium">필요 등급</span>
              <select className={inputClass} name="required_role" defaultValue="MEMBER">
                <option value="MEMBER">MEMBER</option>
                <option value="PREMIUM">PREMIUM</option>
              </select>
            </label>
            <label className="block text-sm">
              <span className="font-medium">순서</span>
              <input type="number" className={inputClass} name="sort_order" defaultValue={0} />
            </label>
            <label className="block text-sm">
              <span className="font-medium">길이(초)</span>
              <input type="number" className={inputClass} name="duration_sec" />
            </label>
            <label className="block text-sm sm:col-span-2">
              <span className="font-medium">강의 썸네일 (선택)</span>
              <input
                className={`${inputClass} cursor-pointer file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-sm`}
                name="thumbnail"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
              />
              <span className="mt-1 block text-xs text-muted-foreground">
                JPG, PNG, WebP, GIF 권장. 업로드하지 않으면 강의 카드에 기본 배경이 표시됩니다.
              </span>
            </label>
            <div className="sm:col-span-2">
              <button type="submit" className={btnPrimary} disabled={createPending}>
                {createPending ? '등록 중…' : '등록'}
              </button>
            </div>
          </div>
        </form>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold">등록된 영상</h2>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead className="border-b border-border bg-muted/50">
              <tr>
                <th className="px-3 py-2 font-semibold">썸네일</th>
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
                  <EditVideoRow
                    key={v.id}
                    video={v}
                    onCancel={() => setEditingId(null)}
                    onSuccess={() => {
                      setEditingId(null)
                      void load()
                    }}
                    btnPrimary={btnPrimary}
                    btnSecondary={btnSecondary}
                    inputClass={inputClass}
                  />
                ) : (
                  <tr key={v.id} className="border-b border-border">
                    <td className="px-3 py-2">
                      <div className="relative h-14 w-24 overflow-hidden rounded-md bg-muted">
                        {thumbPreview(v.thumbnail_path) ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={thumbPreview(v.thumbnail_path)!}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="flex h-full items-center justify-center text-[10px] text-muted-foreground">
                            없음
                          </span>
                        )}
                      </div>
                    </td>
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
                        onClick={() => setEditingId(v.id)}
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

function EditVideoRow({
  video,
  onCancel,
  onSuccess,
  btnPrimary,
  btnSecondary,
  inputClass,
}: {
  video: Video
  onCancel: () => void
  onSuccess: () => void
  btnPrimary: string
  btnSecondary: string
  inputClass: string
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    updateLectureVideoAction,
    null,
  )
  const prevPending = useRef(false)

  useEffect(() => {
    if (prevPending.current && !pending && state === null) {
      onSuccess()
    }
    prevPending.current = pending
  }, [pending, state, onSuccess])

  return (
    <tr className="border-b border-border bg-muted/20">
      <td className="px-3 py-4" colSpan={8}>
        <form action={formAction} encType="multipart/form-data" className="space-y-4">
          <input type="hidden" name="id" value={video.id} />
          {state?.error ? (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {state.error}
            </p>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <label className="block text-sm">
              <span className="font-medium">제목</span>
              <input className={inputClass} name="title" required defaultValue={video.title} />
            </label>
            <label className="block text-sm">
              <span className="font-medium">YouTube ID</span>
              <input className={inputClass} name="youtube_id" required defaultValue={video.youtube_id} />
            </label>
            <label className="block text-sm">
              <span className="font-medium">카테고리</span>
              <input className={inputClass} name="category" defaultValue={video.category ?? ''} />
            </label>
            <label className="block text-sm">
              <span className="font-medium">필요 등급</span>
              <select
                className={inputClass}
                name="required_role"
                defaultValue={video.required_role as VideoRole}
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
                name="sort_order"
                defaultValue={video.sort_order}
              />
            </label>
            <label className="block text-sm">
              <span className="font-medium">길이(초)</span>
              <input
                type="number"
                className={inputClass}
                name="duration_sec"
                defaultValue={video.duration_sec ?? ''}
              />
            </label>
            <label className="block text-sm sm:col-span-2 lg:col-span-3">
              <span className="font-medium">새 썸네일 (선택)</span>
              <input
                className={`${inputClass} cursor-pointer file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-sm`}
                name="thumbnail"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
              />
            </label>
            {video.thumbnail_path ? (
              <label className="flex items-center gap-2 text-sm sm:col-span-2 lg:col-span-3">
                <input type="checkbox" name="remove_thumbnail" className="rounded border-input" />
                <span>기존 썸네일 삭제 (새 파일을 올리면 자동으로 교체됩니다)</span>
              </label>
            ) : null}
            <div className="flex flex-wrap gap-2 sm:col-span-2 lg:col-span-3">
              <button type="submit" className={btnPrimary} disabled={pending}>
                {pending ? '저장 중…' : '저장'}
              </button>
              <button type="button" className={btnSecondary} onClick={onCancel} disabled={pending}>
                취소
              </button>
            </div>
          </div>
          {video.thumbnail_path && thumbPreview(video.thumbnail_path) ? (
            <p className="text-xs text-muted-foreground">
              현재 썸네일:{' '}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={thumbPreview(video.thumbnail_path)!}
                alt=""
                className="mt-1 inline-block h-16 max-w-[200px] rounded border object-cover align-middle"
              />
            </p>
          ) : null}
        </form>
      </td>
    </tr>
  )
}
