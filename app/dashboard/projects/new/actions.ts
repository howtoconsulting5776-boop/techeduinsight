'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/app/lib/supabase/server'

export async function createProject(
  _prevState: { error?: string } | null,
  formData: FormData,
): Promise<{ error?: string } | null> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const title = (formData.get('title') as string).trim()
  const description = (formData.get('description') as string | null)?.trim() || null
  const deployUrl = (formData.get('deploy_url') as string | null)?.trim() || null
  const tagsRaw = (formData.get('tags') as string | null)?.trim() || ''
  const tags = tagsRaw
    ? tagsRaw.split(',').map((t) => t.trim()).filter(Boolean)
    : []

  // iframe_allowed is set by ADMIN when publishing (PRD)
  const iframeAllowed = false

  // Handle thumbnail upload
  let thumbnailPath: string | null = null
  const thumbnailFile = formData.get('thumbnail') as File | null

  if (thumbnailFile && thumbnailFile.size > 0) {
    const ext = thumbnailFile.name.split('.').pop() ?? 'png'
    const filePath = `${user.id}/${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('thumbnails')
      .upload(filePath, thumbnailFile, { upsert: false })

    if (uploadError) {
      return { error: `썸네일 업로드 실패: ${uploadError.message}` }
    }
    thumbnailPath = filePath
  }

  const { error } = await supabase.from('projects').insert({
    owner_id: user.id,
    title,
    description,
    deploy_url: deployUrl,
    tags: tags.length > 0 ? tags : null,
    thumbnail_path: thumbnailPath,
    iframe_allowed: iframeAllowed,
    status: 'draft',
  })

  if (error) {
    return { error: `프로젝트 저장 실패: ${error.message}` }
  }

  redirect('/dashboard/projects')
}
