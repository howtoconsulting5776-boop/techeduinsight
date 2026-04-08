import type { SupabaseClient } from '@supabase/supabase-js'
import { THUMBNAIL_UPLOAD_CACHE_CONTROL } from '@/app/lib/storage'

export type CreateProjectFromFormResult = { ok: true } | { ok: false; error: string }

/**
 * 프로젝트 초안 생성 (Storage 업로드 + projects insert).
 * Route Handler 등에서 FormData를 그대로 넘길 때 사용합니다.
 */
export async function createProjectFromForm(
  supabase: SupabaseClient,
  userId: string,
  formData: FormData,
): Promise<CreateProjectFromFormResult> {
  const title = (formData.get('title') as string)?.trim()
  if (!title) return { ok: false, error: '제목을 입력해 주세요.' }

  const description = (formData.get('description') as string | null)?.trim() || null
  const deployUrl = (formData.get('deploy_url') as string | null)?.trim() || null
  const tagsRaw = (formData.get('tags') as string | null)?.trim() || ''
  const tags = tagsRaw
    ? tagsRaw.split(',').map((t) => t.trim()).filter(Boolean)
    : []

  const iframeAllowed = false

  let thumbnailPath: string | null = null
  const thumbnailFile = formData.get('thumbnail') as File | null

  if (thumbnailFile && thumbnailFile.size > 0) {
    const ext = thumbnailFile.name.split('.').pop() ?? 'png'
    const filePath = `${userId}/${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('thumbnails')
      .upload(filePath, thumbnailFile, {
        upsert: false,
        cacheControl: THUMBNAIL_UPLOAD_CACHE_CONTROL,
      })

    if (uploadError) {
      return { ok: false, error: `썸네일 업로드 실패: ${uploadError.message}` }
    }
    thumbnailPath = filePath
  }

  const { error } = await supabase.from('projects').insert({
    owner_id: userId,
    title,
    description,
    deploy_url: deployUrl,
    tags: tags.length > 0 ? tags : null,
    thumbnail_path: thumbnailPath,
    iframe_allowed: iframeAllowed,
    status: 'draft',
  })

  if (error) {
    return { ok: false, error: `프로젝트 저장 실패: ${error.message}` }
  }

  return { ok: true }
}
