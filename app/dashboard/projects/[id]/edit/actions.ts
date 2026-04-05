'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/app/lib/supabase/server'

export async function updateProject(
  _prevState: { error?: string } | null,
  formData: FormData,
): Promise<{ error?: string } | null> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const id = (formData.get('id') as string)?.trim()
  if (!id) return { error: '프로젝트를 찾을 수 없습니다.' }

  const title = (formData.get('title') as string).trim()
  const description = (formData.get('description') as string | null)?.trim() || null
  const deployUrl = (formData.get('deploy_url') as string | null)?.trim() || null
  const tagsRaw = (formData.get('tags') as string | null)?.trim() || ''
  const tags = tagsRaw
    ? tagsRaw.split(',').map((t) => t.trim()).filter(Boolean)
    : []

  let thumbnailPath =
    ((formData.get('thumbnail_path_current') as string | null) || '').trim() || null

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

  const { data: updated, error } = await supabase
    .from('projects')
    .update({
      title,
      description,
      deploy_url: deployUrl,
      tags: tags.length > 0 ? tags : null,
      thumbnail_path: thumbnailPath,
    })
    .eq('id', id)
    .eq('owner_id', user.id)
    .select('id')
    .maybeSingle()

  if (error) {
    return { error: `저장 실패: ${error.message}` }
  }
  if (!updated) {
    return { error: '수정할 수 없습니다. 초안 상태인지 확인하세요.' }
  }

  revalidatePath('/dashboard/projects')
  revalidatePath(`/projects/${id}`)
  redirect('/dashboard/projects')
}

export async function deleteProject(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const id = (formData.get('id') as string)?.trim()
  if (!id) redirect('/dashboard/projects')

  const { data: removed } = await supabase
    .from('projects')
    .delete()
    .eq('id', id)
    .eq('owner_id', user.id)
    .select('id')
    .maybeSingle()

  if (!removed) {
    redirect('/dashboard/projects')
  }

  revalidatePath('/dashboard/projects')
  revalidatePath('/')
  redirect('/dashboard/projects')
}
