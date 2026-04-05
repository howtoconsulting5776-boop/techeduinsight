'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/app/lib/supabase/server'

async function viewerIsAdmin(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()
  return profile?.role === 'ADMIN'
}

export async function updateProject(
  _prevState: { error?: string } | null,
  formData: FormData,
): Promise<{ error?: string } | null> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const admin = await viewerIsAdmin(supabase, user.id)

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

  let updateQuery = supabase
    .from('projects')
    .update({
      title,
      description,
      deploy_url: deployUrl,
      tags: tags.length > 0 ? tags : null,
      thumbnail_path: thumbnailPath,
    })
    .eq('id', id)

  if (!admin) {
    updateQuery = updateQuery.eq('owner_id', user.id)
  }

  const { data: updated, error } = await updateQuery.select('id').maybeSingle()

  if (error) {
    return { error: `저장 실패: ${error.message}` }
  }
  if (!updated) {
    return { error: '수정할 수 없습니다. 권한이 있는지 확인하세요.' }
  }

  revalidatePath('/dashboard/projects')
  revalidatePath('/admin/projects')
  revalidatePath(`/projects/${id}`)
  revalidatePath('/')
  redirect(admin ? '/admin/projects' : '/dashboard/projects')
}

export async function deleteProject(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const admin = await viewerIsAdmin(supabase, user.id)

  const id = (formData.get('id') as string)?.trim()
  if (!id) redirect(admin ? '/admin/projects' : '/dashboard/projects')

  let deleteQuery = supabase.from('projects').delete().eq('id', id)
  if (!admin) {
    deleteQuery = deleteQuery.eq('owner_id', user.id)
  }

  const { data: removed } = await deleteQuery.select('id').maybeSingle()

  if (!removed) {
    redirect(admin ? '/admin/projects' : '/dashboard/projects')
  }

  revalidatePath('/dashboard/projects')
  revalidatePath('/admin/projects')
  revalidatePath(`/projects/${id}`)
  revalidatePath('/')
  redirect(admin ? '/admin/projects' : '/dashboard/projects')
}
