'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/app/lib/supabase/server'
import { createServiceRoleClient } from '@/app/lib/supabase/service'
import type { Video } from '@/app/lib/types'
import type { VideoRole } from '@/app/lib/types'

export type AdminEditableUserRole =
  | 'GUEST'
  | 'MEMBER'
  | 'PREMIUM'
  | 'TEACHER'
  | 'ADMIN'

export interface AdminUserRow {
  id: string
  email: string
  display_name: string | null
  role: string
  created_at: string
}

export async function adminListUsers(): Promise<
  { ok: true; users: AdminUserRow[] } | { ok: false; error: string }
> {
  const ctx = await getAdminClientOrNull()
  if (!ctx) return { ok: false, error: '권한이 없습니다.' }

  const svc = createServiceRoleClient()
  const { data: profiles, error } = await svc
    .from('profiles')
    .select('id, display_name, role, created_at')
    .order('created_at', { ascending: false })

  if (error) return { ok: false, error: error.message }

  const emailMap = new Map<string, string>()
  let page = 1
  for (;;) {
    const { data: lu, error: listErr } = await svc.auth.admin.listUsers({
      page,
      perPage: 200,
    })
    if (listErr) {
      return { ok: false, error: listErr.message }
    }
    const batch = lu?.users ?? []
    for (const u of batch) {
      emailMap.set(u.id, u.email ?? '—')
    }
    if (batch.length < 200) break
    page++
  }

  const users: AdminUserRow[] = (profiles ?? []).map((p) => ({
    id: p.id,
    email: emailMap.get(p.id) ?? '—',
    display_name: p.display_name,
    role: p.role as string,
    created_at: p.created_at,
  }))

  return { ok: true, users }
}

async function getAdminClientOrNull() {
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
  return { supabase, userId: user.id }
}

export async function adminUpdateUserRole(
  targetUserId: string,
  role: AdminEditableUserRole,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const ctx = await getAdminClientOrNull()
  if (!ctx) return { ok: false, error: '권한이 없습니다.' }

  const svc = createServiceRoleClient()
  const { error } = await svc.from('profiles').update({ role }).eq('id', targetUserId)

  if (error) return { ok: false, error: error.message }
  revalidatePath('/admin/users')
  return { ok: true }
}

export async function adminListVideos(): Promise<
  { ok: true; videos: Video[] } | { ok: false; error: string }
> {
  const ctx = await getAdminClientOrNull()
  if (!ctx) return { ok: false, error: '권한이 없습니다.' }

  const { data, error } = await ctx.supabase
    .from('videos')
    .select('*')
    .order('sort_order', { ascending: true })

  if (error) return { ok: false, error: error.message }
  return { ok: true, videos: (data ?? []) as Video[] }
}

export async function adminCreateVideo(input: {
  title: string
  youtube_id: string
  category: string | null
  required_role: VideoRole
  sort_order: number
  duration_sec: number | null
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const ctx = await getAdminClientOrNull()
  if (!ctx) return { ok: false, error: '권한이 없습니다.' }

  const { error } = await ctx.supabase.from('videos').insert({
    title: input.title.trim(),
    youtube_id: input.youtube_id.trim(),
    category: input.category?.trim() || null,
    required_role: input.required_role,
    sort_order: input.sort_order,
    duration_sec: input.duration_sec,
  })

  if (error) return { ok: false, error: error.message }
  revalidatePath('/admin/videos')
  revalidatePath('/lectures')
  return { ok: true }
}

export async function adminUpdateVideo(
  id: string,
  input: {
    title: string
    youtube_id: string
    category: string | null
    required_role: VideoRole
    sort_order: number
    duration_sec: number | null
  },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const ctx = await getAdminClientOrNull()
  if (!ctx) return { ok: false, error: '권한이 없습니다.' }

  const { error } = await ctx.supabase
    .from('videos')
    .update({
      title: input.title.trim(),
      youtube_id: input.youtube_id.trim(),
      category: input.category?.trim() || null,
      required_role: input.required_role,
      sort_order: input.sort_order,
      duration_sec: input.duration_sec,
    })
    .eq('id', id)

  if (error) return { ok: false, error: error.message }
  revalidatePath('/admin/videos')
  revalidatePath('/lectures')
  return { ok: true }
}

export async function adminDeleteVideo(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const ctx = await getAdminClientOrNull()
  if (!ctx) return { ok: false, error: '권한이 없습니다.' }

  const { error } = await ctx.supabase.from('videos').delete().eq('id', id)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/admin/videos')
  revalidatePath('/lectures')
  return { ok: true }
}

export interface AdminProjectRow {
  id: string
  title: string
  owner_id: string
  status: 'draft' | 'published'
  iframe_allowed: boolean
  created_at: string
  owner_display_name: string | null
}

export async function adminListProjects(): Promise<
  { ok: true; projects: AdminProjectRow[] } | { ok: false; error: string }
> {
  const ctx = await getAdminClientOrNull()
  if (!ctx) return { ok: false, error: '권한이 없습니다.' }

  const { data, error } = await ctx.supabase
    .from('projects')
    .select('id, title, owner_id, status, iframe_allowed, created_at, profiles(display_name)')
    .order('created_at', { ascending: false })

  if (error) return { ok: false, error: error.message }

  const projects: AdminProjectRow[] = (data ?? []).map((row) => {
    const prof = row.profiles as
      | { display_name: string | null }
      | { display_name: string | null }[]
      | null
    const owner_display_name = Array.isArray(prof)
      ? (prof[0]?.display_name ?? null)
      : (prof?.display_name ?? null)
    return {
      id: row.id as string,
      title: row.title as string,
      owner_id: row.owner_id as string,
      status: row.status as 'draft' | 'published',
      iframe_allowed: row.iframe_allowed as boolean,
      created_at: row.created_at as string,
      owner_display_name,
    }
  })

  return { ok: true, projects }
}

export async function adminSetProjectPublished(
  projectId: string,
  published: boolean,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const ctx = await getAdminClientOrNull()
  if (!ctx) return { ok: false, error: '권한이 없습니다.' }

  const { error } = await ctx.supabase
    .from('projects')
    .update({ status: published ? 'published' : 'draft' })
    .eq('id', projectId)

  if (error) return { ok: false, error: error.message }
  revalidatePath('/admin/projects')
  revalidatePath('/')
  revalidatePath(`/projects/${projectId}`)
  return { ok: true }
}

export async function adminSetProjectIframeAllowed(
  projectId: string,
  iframeAllowed: boolean,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const ctx = await getAdminClientOrNull()
  if (!ctx) return { ok: false, error: '권한이 없습니다.' }

  const { error } = await ctx.supabase
    .from('projects')
    .update({ iframe_allowed: iframeAllowed })
    .eq('id', projectId)

  if (error) return { ok: false, error: error.message }
  revalidatePath('/admin/projects')
  revalidatePath(`/projects/${projectId}`)
  return { ok: true }
}

export interface AdminStatsPayload {
  totalMembers: number
  premiumMembers: number
  totalProjects: number
  totalVideos: number
  videoProgress: Array<{
    videoId: string
    title: string
    avgProgress: number
    learners: number
  }>
}

export async function adminLoadStats(): Promise<
  { ok: true; stats: AdminStatsPayload } | { ok: false; error: string }
> {
  const ctx = await getAdminClientOrNull()
  if (!ctx) return { ok: false, error: '권한이 없습니다.' }

  const svc = createServiceRoleClient()

  const { count: totalMembers } = await svc
    .from('profiles')
    .select('*', { count: 'exact', head: true })

  const { count: premiumMembers } = await svc
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'PREMIUM')

  const { count: totalProjects } = await svc
    .from('projects')
    .select('*', { count: 'exact', head: true })

  const { count: totalVideos } = await svc
    .from('videos')
    .select('*', { count: 'exact', head: true })

  const { data: videos } = await svc.from('videos').select('id, title')
  const { data: history } = await svc.from('watch_history').select('video_id, progress_pct')

  const agg = new Map<string, { sum: number; n: number }>()
  for (const h of history ?? []) {
    const cur = agg.get(h.video_id) ?? { sum: 0, n: 0 }
    cur.sum += h.progress_pct
    cur.n += 1
    agg.set(h.video_id, cur)
  }

  const videoProgress = (videos ?? []).map((v) => {
    const a = agg.get(v.id)
    const avgProgress = a && a.n > 0 ? Math.round((a.sum / a.n) * 10) / 10 : 0
    return {
      videoId: v.id,
      title: v.title,
      avgProgress,
      learners: a?.n ?? 0,
    }
  })

  return {
    ok: true,
    stats: {
      totalMembers: totalMembers ?? 0,
      premiumMembers: premiumMembers ?? 0,
      totalProjects: totalProjects ?? 0,
      totalVideos: totalVideos ?? 0,
      videoProgress,
    },
  }
}
