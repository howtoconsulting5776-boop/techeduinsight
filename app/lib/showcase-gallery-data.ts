import type { SupabaseClient, User } from '@supabase/supabase-js'
import type { ProjectGalleryItem, ProjectWithProfile } from '@/app/lib/types'

export type ShowcaseGalleryResult = {
  projects: ProjectGalleryItem[]
}

/**
 * 공개(발행) 프로젝트를 쇼케이스용 갤러리 아이템으로 조회합니다.
 * 작성자 표시는 `showcase_owner_profiles` RPC로 채웁니다(임베드 조인 대신).
 * `limit`을 주면 최근 게시 순으로 상한만큼만 가져옵니다.
 */
export async function getShowcaseGalleryItems(
  supabase: SupabaseClient,
  user: User | null,
  options?: { limit?: number },
): Promise<ShowcaseGalleryResult> {
  const limit = options?.limit

  let q = supabase
    .from('projects')
    .select('*')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
  if (limit != null) q = q.limit(limit)

  const { data: rows, error: projErr } = await q

  if (projErr) {
    const msg = projErr.message
    const soft = /fetch|timeout|aborted|network|ECONNRESET|UND_ERR/i.test(msg)
    if (soft) console.warn('[showcase] projects (network):', msg)
    else console.error('[showcase] projects select failed:', msg)
    return { projects: [] }
  }

  const raw = rows ?? []
  const ownerIds = [...new Set(raw.map((r) => r.owner_id as string))]

  const profileMap = new Map<string, { display_name: string | null; avatar_url: string | null }>()
  if (ownerIds.length > 0) {
    const { data: profs, error: rpcErr } = await supabase.rpc('showcase_owner_profiles', {
      p_owner_ids: ownerIds,
    })
    if (rpcErr) {
      console.warn('[showcase] showcase_owner_profiles:', rpcErr.message)
    } else {
      for (const row of profs ?? []) {
        const r = row as { id: string; display_name: string | null; avatar_url: string | null }
        profileMap.set(r.id, { display_name: r.display_name, avatar_url: r.avatar_url })
      }
    }
  }

  const items: ProjectWithProfile[] = raw.map((row) => ({
    ...row,
    profiles: profileMap.get(row.owner_id as string) ?? {
      display_name: null,
      avatar_url: null,
    },
  })) as ProjectWithProfile[]

  const ids = items.map((p) => p.id)
  const site = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, '') ?? ''

  const countMap = new Map<string, { likes: number; comments: number; shares: number }>()
  if (ids.length > 0) {
    const { data: countRows, error: rpcErr } = await supabase.rpc('project_social_counts', {
      p_ids: ids,
    })
    if (rpcErr) {
      console.warn('[showcase] project_social_counts:', rpcErr.message)
    } else {
      for (const row of countRows ?? []) {
        const r = row as {
          project_id: string
          likes_count: number
          comments_count: number
          share_count?: number
        }
        countMap.set(r.project_id, {
          likes: Number(r.likes_count),
          comments: Number(r.comments_count),
          shares: Number(r.share_count ?? 0),
        })
      }
    }
  }

  let likedIds = new Set<string>()
  if (user && ids.length > 0) {
    const { data: likeRows, error: likeErr } = await supabase
      .from('project_likes')
      .select('project_id')
      .eq('user_id', user.id)
      .in('project_id', ids)
    if (likeErr) {
      console.warn('[showcase] project_likes:', likeErr.message)
    } else {
      likedIds = new Set((likeRows ?? []).map((r) => r.project_id as string))
    }
  }

  const projects: ProjectGalleryItem[] = items.map((p) => {
    const c = countMap.get(p.id) ?? { likes: 0, comments: 0, shares: 0 }
    const share_url = site ? `${site}/projects/${p.id}` : `/projects/${p.id}`
    return {
      ...p,
      likes_count: c.likes,
      comments_count: c.comments,
      share_count: c.shares,
      liked_by_me: likedIds.has(p.id),
      share_url,
    }
  })

  return { projects }
}
