'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/app/lib/supabase/server'
import type { VideoRole } from '@/app/lib/types'

type ActionResult = { error: string } | null

async function requireAdminSupabase() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'ADMIN') return null
  return supabase
}

async function uploadLectureThumbnail(
  supabase: NonNullable<Awaited<ReturnType<typeof requireAdminSupabase>>>,
  videoId: string,
  file: File,
): Promise<string> {
  const rawExt = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const ext = /^[a-z0-9]+$/i.test(rawExt) ? rawExt : 'jpg'
  const path = `lectures/${videoId}/${Date.now()}.${ext}`
  const body = Buffer.from(await file.arrayBuffer())
  const { error } = await supabase.storage.from('thumbnails').upload(path, body, {
    contentType: file.type || undefined,
    upsert: false,
  })
  if (error) throw new Error(error.message)
  return path
}

async function removeThumbnailIfPresent(
  supabase: NonNullable<Awaited<ReturnType<typeof requireAdminSupabase>>>,
  path: string | null | undefined,
) {
  if (!path?.trim()) return
  await supabase.storage.from('thumbnails').remove([path.trim()])
}

export async function createLectureVideoAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await requireAdminSupabase()
  if (!supabase) return { error: '권한이 없습니다.' }

  const title = (formData.get('title') as string)?.trim()
  const youtubeId = (formData.get('youtube_id') as string)?.trim()
  const category = (formData.get('category') as string)?.trim() || null
  const requiredRole = (formData.get('required_role') as string) === 'PREMIUM' ? 'PREMIUM' : 'MEMBER'
  const sortOrder = Number.parseInt((formData.get('sort_order') as string) || '0', 10)
  const durRaw = (formData.get('duration_sec') as string)?.trim()
  const durationSec =
    durRaw === '' || durRaw == null ? null : Number.parseInt(durRaw, 10)
  const thumbFile = formData.get('thumbnail') as File | null

  if (!title || !youtubeId) {
    return { error: '제목과 YouTube ID는 필수입니다.' }
  }

  const { data: inserted, error: insErr } = await supabase
    .from('videos')
    .insert({
      title,
      youtube_id: youtubeId,
      category,
      required_role: requiredRole as VideoRole,
      sort_order: Number.isFinite(sortOrder) ? sortOrder : 0,
      duration_sec: durationSec != null && Number.isFinite(durationSec) ? durationSec : null,
    })
    .select('id')
    .single()

  if (insErr || !inserted?.id) {
    return { error: insErr?.message ?? '등록에 실패했습니다.' }
  }

  const videoId = inserted.id as string

  if (thumbFile && typeof thumbFile === 'object' && thumbFile.size > 0) {
    try {
      const path = await uploadLectureThumbnail(supabase, videoId, thumbFile)
      const { error: upErr } = await supabase
        .from('videos')
        .update({ thumbnail_path: path })
        .eq('id', videoId)
      if (upErr) {
        await removeThumbnailIfPresent(supabase, path)
        return { error: `썸네일 DB 반영 실패: ${upErr.message}` }
      }
    } catch (e) {
      await supabase.from('videos').delete().eq('id', videoId)
      return { error: e instanceof Error ? e.message : '썸네일 업로드 실패' }
    }
  }

  revalidatePath('/admin/videos')
  revalidatePath('/lectures')
  return null
}

export async function updateLectureVideoAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await requireAdminSupabase()
  if (!supabase) return { error: '권한이 없습니다.' }

  const id = (formData.get('id') as string)?.trim()
  if (!id) return { error: '영상 ID가 없습니다.' }

  const title = (formData.get('title') as string)?.trim()
  const youtubeId = (formData.get('youtube_id') as string)?.trim()
  const category = (formData.get('category') as string)?.trim() || null
  const requiredRole = (formData.get('required_role') as string) === 'PREMIUM' ? 'PREMIUM' : 'MEMBER'
  const sortOrder = Number.parseInt((formData.get('sort_order') as string) || '0', 10)
  const durRaw = (formData.get('duration_sec') as string)?.trim()
  const durationSec =
    durRaw === '' || durRaw == null ? null : Number.parseInt(durRaw, 10)
  const thumbFile = formData.get('thumbnail') as File | null
  const removeThumb = (formData.get('remove_thumbnail') as string) === 'on'

  if (!title || !youtubeId) {
    return { error: '제목과 YouTube ID는 필수입니다.' }
  }

  const { data: current } = await supabase
    .from('videos')
    .select('thumbnail_path')
    .eq('id', id)
    .single()

  const previousPath = (current?.thumbnail_path as string | null) ?? null
  let nextPath: string | null = previousPath

  if (removeThumb && (!thumbFile || thumbFile.size === 0)) {
    nextPath = null
  }

  if (thumbFile && typeof thumbFile === 'object' && thumbFile.size > 0) {
    try {
      const uploaded = await uploadLectureThumbnail(supabase, id, thumbFile)
      nextPath = uploaded
    } catch (e) {
      return { error: e instanceof Error ? e.message : '썸네일 업로드 실패' }
    }
  }

  const { error: upErr } = await supabase
    .from('videos')
    .update({
      title,
      youtube_id: youtubeId,
      category,
      required_role: requiredRole as VideoRole,
      sort_order: Number.isFinite(sortOrder) ? sortOrder : 0,
      duration_sec: durationSec != null && Number.isFinite(durationSec) ? durationSec : null,
      thumbnail_path: nextPath,
    })
    .eq('id', id)

  if (upErr) {
    if (
      thumbFile &&
      typeof thumbFile === 'object' &&
      thumbFile.size > 0 &&
      nextPath &&
      nextPath !== previousPath
    ) {
      await removeThumbnailIfPresent(supabase, nextPath)
    }
    return { error: upErr.message }
  }

  const replaced =
    thumbFile &&
    typeof thumbFile === 'object' &&
    thumbFile.size > 0 &&
    previousPath &&
    nextPath !== previousPath
  if (replaced || (removeThumb && previousPath && !nextPath)) {
    if (previousPath && (replaced || removeThumb)) {
      await removeThumbnailIfPresent(supabase, previousPath)
    }
  }

  revalidatePath('/admin/videos')
  revalidatePath('/lectures')
  return null
}
