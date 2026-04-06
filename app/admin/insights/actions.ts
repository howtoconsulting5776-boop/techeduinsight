'use server'

import { revalidatePath } from 'next/cache'
import { createServiceRoleClient } from '@/app/lib/supabase/service'
import { getAdminClientOrNull } from '@/app/admin/actions'
import type { EduInsight } from '@/app/lib/types'

export type AdminInsightRow = EduInsight

function parseInsightForm(formData: FormData): {
  id: string | null
  title: string
  summary: string | null
  source_name: string
  source_url: string
  image_url: string | null
  category: string | null
  tags: string[] | null
  published_at: string
  sort_priority: number
  is_published: boolean
} | { error: string } {
  const idRaw = (formData.get('id') as string | null)?.trim() || null
  const id = idRaw && idRaw.length > 0 ? idRaw : null

  const title = (formData.get('title') as string)?.trim() ?? ''
  const sourceName = (formData.get('source_name') as string)?.trim() ?? ''
  const sourceUrl = (formData.get('source_url') as string)?.trim() ?? ''
  const summary = (formData.get('summary') as string | null)?.trim() || null
  const imageUrl = (formData.get('image_url') as string | null)?.trim() || null
  const category = (formData.get('category') as string | null)?.trim() || null
  const tagsRaw = (formData.get('tags') as string | null)?.trim() || ''
  const tags = tagsRaw
    ? tagsRaw.split(',').map((t) => t.trim()).filter(Boolean)
    : null

  const publishedAtRaw = (formData.get('published_at') as string | null)?.trim() ?? ''
  const sortRaw = (formData.get('sort_priority') as string | null)?.trim() ?? '0'
  const sort_priority = Number.parseInt(sortRaw, 10)
  const pubRaw = formData.get('is_published')
  const is_published = pubRaw === 'on' || pubRaw === 'true' || pubRaw === '1'

  if (!title) return { error: '제목을 입력하세요.' }
  if (!sourceName) return { error: '출처명을 입력하세요.' }
  if (!sourceUrl) return { error: '원문 URL을 입력하세요.' }
  if (!publishedAtRaw) return { error: '게시일시를 입력하세요.' }

  try {
    const u = new URL(sourceUrl)
    if (u.protocol !== 'http:' && u.protocol !== 'https:') {
      return { error: 'http 또는 https URL만 사용할 수 있습니다.' }
    }
  } catch {
    return { error: '올바른 원문 URL을 입력하세요.' }
  }

  if (imageUrl) {
    try {
      const u = new URL(imageUrl)
      if (u.protocol !== 'http:' && u.protocol !== 'https:') {
        return { error: '썸네일 URL은 http 또는 https여야 합니다.' }
      }
    } catch {
      return { error: '올바른 썸네일 URL을 입력하세요.' }
    }
  }

  const publishedDate = new Date(publishedAtRaw)
  if (Number.isNaN(publishedDate.getTime())) {
    return { error: '게시일시 형식이 올바르지 않습니다.' }
  }

  return {
    id,
    title,
    summary,
    source_name: sourceName,
    source_url: sourceUrl,
    image_url: imageUrl,
    category,
    tags: tags && tags.length > 0 ? tags : null,
    published_at: publishedDate.toISOString(),
    sort_priority: Number.isFinite(sort_priority) ? sort_priority : 0,
    is_published,
  }
}

function revalidateInsightPaths(detailId?: string | null) {
  revalidatePath('/')
  revalidatePath('/insights')
  revalidatePath('/admin/insights')
  if (detailId) {
    revalidatePath(`/insights/${detailId}`)
  }
}

export async function adminListInsights(): Promise<
  { ok: true; insights: AdminInsightRow[] } | { ok: false; error: string }
> {
  const ctx = await getAdminClientOrNull()
  if (!ctx) return { ok: false, error: '권한이 없습니다.' }

  const svc = createServiceRoleClient()
  const { data, error } = await svc
    .from('edu_insights')
    .select('*')
    .order('published_at', { ascending: false })
    .order('sort_priority', { ascending: false })

  if (error) return { ok: false, error: error.message }
  return { ok: true, insights: (data ?? []) as AdminInsightRow[] }
}

export async function adminUpsertInsight(
  formData: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const ctx = await getAdminClientOrNull()
  if (!ctx) return { ok: false, error: '권한이 없습니다.' }

  const parsed = parseInsightForm(formData)
  if ('error' in parsed) return { ok: false, error: parsed.error }

  const svc = createServiceRoleClient()
  const row = {
    title: parsed.title,
    summary: parsed.summary,
    source_name: parsed.source_name,
    source_url: parsed.source_url,
    image_url: parsed.image_url,
    category: parsed.category,
    tags: parsed.tags,
    published_at: parsed.published_at,
    sort_priority: parsed.sort_priority,
    is_published: parsed.is_published,
  }

  let affectedId: string | null = parsed.id

  if (parsed.id) {
    const { error } = await svc.from('edu_insights').update(row).eq('id', parsed.id)
    if (error) return { ok: false, error: error.message }
  } else {
    const { data: inserted, error } = await svc.from('edu_insights').insert(row).select('id').single()
    if (error) return { ok: false, error: error.message }
    affectedId = (inserted as { id: string } | null)?.id ?? null
  }

  revalidateInsightPaths(affectedId)
  return { ok: true }
}

export async function adminDeleteInsight(
  insightId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const ctx = await getAdminClientOrNull()
  if (!ctx) return { ok: false, error: '권한이 없습니다.' }

  const id = insightId?.trim()
  if (!id) return { ok: false, error: '항목을 찾을 수 없습니다.' }

  const svc = createServiceRoleClient()
  const { error } = await svc.from('edu_insights').delete().eq('id', id)
  if (error) return { ok: false, error: error.message }

  revalidateInsightPaths(id)
  return { ok: true }
}

export async function adminSetInsightPublished(
  insightId: string,
  published: boolean,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const ctx = await getAdminClientOrNull()
  if (!ctx) return { ok: false, error: '권한이 없습니다.' }

  const id = insightId?.trim()
  if (!id) return { ok: false, error: '항목을 찾을 수 없습니다.' }

  const svc = createServiceRoleClient()
  const { error } = await svc.from('edu_insights').update({ is_published: published }).eq('id', id)
  if (error) return { ok: false, error: error.message }

  revalidateInsightPaths(id)
  return { ok: true }
}
