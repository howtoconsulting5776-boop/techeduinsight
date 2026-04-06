'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/app/lib/supabase/server'
import { isProjectShareChannel, type ProjectShareChannel } from '@/app/lib/project-social-data'

export async function toggleProjectLike(projectId: string): Promise<
  | { ok: true; liked: boolean; likesCount: number }
  | { ok: false; error: string }
> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { ok: false, error: '로그인이 필요합니다.' }
  }

  const { data: existing } = await supabase
    .from('project_likes')
    .select('project_id')
    .eq('project_id', projectId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase
      .from('project_likes')
      .delete()
      .eq('project_id', projectId)
      .eq('user_id', user.id)
    if (error) return { ok: false, error: error.message }
  } else {
    const { error } = await supabase.from('project_likes').insert({
      project_id: projectId,
      user_id: user.id,
    })
    if (error) return { ok: false, error: error.message }
  }

  let likesCount: number
  const { count, error: cErr } = await supabase
    .from('project_likes')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId)

  if (cErr) {
    const { data: rows, error: e2 } = await supabase
      .from('project_likes')
      .select('project_id')
      .eq('project_id', projectId)
    if (e2) return { ok: false, error: e2.message }
    likesCount = rows?.length ?? 0
  } else {
    likesCount = count ?? 0
  }

  revalidatePath('/')
  revalidatePath('/')
  revalidatePath(`/projects/${projectId}`)

  return { ok: true, liked: !existing, likesCount }
}

export async function addProjectComment(
  projectId: string,
  body: string,
  parentId?: string | null,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const trimmed = body.trim()
    if (!trimmed) {
      return { ok: false, error: '댓글 내용을 입력하세요.' }
    }
    if (trimmed.length > 2000) {
      return { ok: false, error: '댓글은 2000자 이하여야 합니다.' }
    }

    const supabase = await createClient()
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser()

    if (authErr) {
      return { ok: false, error: `인증 확인 실패: ${authErr.message}` }
    }
    if (!user) {
      return {
        ok: false,
        error: '로그인이 필요합니다. 새로고침 후 다시 시도하거나 다시 로그인해 주세요.',
      }
    }

    const { data: proj, error: projErr } = await supabase
      .from('projects')
      .select('id, status')
      .eq('id', projectId)
      .maybeSingle()

    if (projErr || !proj) {
      return { ok: false, error: '프로젝트를 찾을 수 없습니다.' }
    }
    if (proj.status !== 'published') {
      return {
        ok: false,
        error: '쇼케이스에 공개된 프로젝트에만 댓글을 달 수 있습니다.',
      }
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', user.id)
      .maybeSingle()

    const authorName =
      profile?.display_name?.trim() || user.email?.split('@')[0] || '회원'

    if (parentId) {
      const { data: parent } = await supabase
        .from('project_comments')
        .select('id, project_id')
        .eq('id', parentId)
        .maybeSingle()
      if (!parent || parent.project_id !== projectId) {
        return { ok: false, error: '잘못된 답글 대상입니다.' }
      }
    }

    const { error } = await supabase.from('project_comments').insert({
      project_id: projectId,
      user_id: user.id,
      author_display_name: authorName,
      body: trimmed,
      ...(parentId ? { parent_id: parentId } : {}),
    })

    if (error) {
      if (/recursion/i.test(error.message)) {
        return {
          ok: false,
          error:
            '댓글 정책(DB) 오류입니다. Supabase에 마이그레이션 011·013을 적용했는지 확인하세요.',
        }
      }
      return { ok: false, error: error.message }
    }

    revalidatePath('/')
    revalidatePath('/')
    revalidatePath(`/projects/${projectId}`, 'page')
    revalidatePath(`/projects/${projectId}`)

    return { ok: true }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    if (/aborted|Abort|timeout/i.test(msg)) {
      return { ok: false, error: '네트워크 시간 초과입니다. 잠시 후 다시 시도해 주세요.' }
    }
    return { ok: false, error: msg }
  }
}

export async function deleteProjectComment(
  commentId: string,
  projectId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser()

    if (authErr || !user) {
      return { ok: false, error: '로그인이 필요합니다.' }
    }

    const { error } = await supabase
      .from('project_comments')
      .delete()
      .eq('id', commentId)
      .eq('project_id', projectId)

    if (error) {
      return { ok: false, error: error.message }
    }

    revalidatePath('/')
    revalidatePath('/')
    revalidatePath(`/projects/${projectId}`, 'page')
    revalidatePath(`/projects/${projectId}`)

    return { ok: true }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    if (/aborted|Abort|timeout/i.test(msg)) {
      return { ok: false, error: '네트워크 시간 초과입니다. 잠시 후 다시 시도해 주세요.' }
    }
    return { ok: false, error: msg }
  }
}

/** 공유 행위 1회 기록 → `project_share_events` + `projects.share_count` (RPC) */
export async function recordProjectShare(
  projectId: string,
  channel: ProjectShareChannel,
): Promise<{ ok: true } | { ok: false }> {
  if (!isProjectShareChannel(channel)) {
    return { ok: false }
  }
  const supabase = await createClient()
  const { error } = await supabase.rpc('record_project_share', {
    p_project_id: projectId,
    p_channel: channel,
  })
  if (error) {
    console.warn('[record_project_share]', error.message)
    return { ok: false }
  }
  revalidatePath('/')
  revalidatePath('/')
  revalidatePath(`/projects/${projectId}`)
  return { ok: true }
}
