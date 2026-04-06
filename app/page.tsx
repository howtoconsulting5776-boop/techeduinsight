import Link from 'next/link'
import { InsightSection } from '@/app/components/insights/InsightSection'
import { getCachedSupabaseAuth } from '@/app/lib/supabase/server'
import ProjectGallery from '@/app/components/ProjectGallery'
import type { EduInsight, ProjectGalleryItem, ProjectWithProfile } from '@/app/lib/types'

export default async function HomePage() {
  const { supabase, user } = await getCachedSupabaseAuth()

  const insightsQuery = supabase
    .from('edu_insights')
    .select('*')
    .eq('is_published', true)
    .order('published_at', { ascending: false })
    .order('sort_priority', { ascending: false })
    .limit(4)

  const showcaseQuery = await supabase
    .from('projects')
    .select('*, profiles(display_name, avatar_url)')
    .eq('status', 'published')
    .order('created_at', { ascending: false })

  let items: ProjectWithProfile[]

  if (showcaseQuery.error) {
    const msg = showcaseQuery.error.message
    const soft = /fetch|timeout|aborted|network|ECONNRESET|UND_ERR/i.test(msg)
    if (soft) console.warn('[showcase] projects (network):', msg)
    else console.error('[showcase] projects select failed:', msg)
    const fallback = await supabase
      .from('projects')
      .select('*')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
    if (fallback.error) {
      const msg = fallback.error.message
      const soft = /fetch|timeout|aborted|network|ECONNRESET|UND_ERR/i.test(msg)
      if (soft) console.warn('[showcase] projects fallback (network):', msg)
      else console.error('[showcase] projects fallback failed:', msg)
      items = []
    } else {
      items = (fallback.data ?? []).map((row) => ({
        ...row,
        profiles: { display_name: null, avatar_url: null },
      })) as ProjectWithProfile[]
    }
  } else {
    items = (showcaseQuery.data ?? []) as ProjectWithProfile[]
  }
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

  const galleryItems: ProjectGalleryItem[] = items.map((p) => {
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

  const { data: insightRows, error: insightsErr } = await insightsQuery
  if (insightsErr) {
    const msg = insightsErr.message
    const missing = /relation|does not exist|Could not find the table/i.test(msg)
    if (missing) {
      console.warn('[insights] home (table missing?):', msg)
    } else {
      console.warn('[insights] home:', msg)
    }
  }
  const insightItems = (!insightsErr ? (insightRows ?? []) : []) as EduInsight[]

  return (
    <>
      <section className="bg-brand-navy px-4 py-16 text-center md:py-24">
        <h1 className="text-4xl font-bold text-white md:text-5xl">TechEdu Insight</h1>
        <p className="mt-4 text-lg text-brand-sky md:text-xl">AI 프로젝트 공유 및 학습 플랫폼</p>
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
          <Link
            href="#showcase"
            className="inline-flex min-w-[200px] items-center justify-center rounded-lg bg-white px-6 py-3 text-sm font-semibold text-brand-navy shadow-sm transition-colors hover:bg-brand-bg"
          >
            프로젝트 둘러보기
          </Link>
          <Link
            href="/lectures"
            className="inline-flex min-w-[200px] items-center justify-center rounded-lg border-2 border-brand-sky bg-transparent px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-sky/20"
          >
            강의 보러가기
          </Link>
        </div>
        {user && (
          <Link
            href="/dashboard/projects/new"
            className="mt-8 inline-block text-sm font-medium text-brand-sky underline-offset-4 hover:underline"
          >
            + 내 프로젝트 등록하기
          </Link>
        )}
      </section>

      {insightItems.length > 0 ? (
        <section
          id="insights"
          aria-label="교육 인사이트"
          className="border-t border-b border-brand-navy/15 bg-muted/45"
        >
          <InsightSection items={insightItems} />
        </section>
      ) : null}

      <main
        id="showcase"
        className={`scroll-mt-20 bg-background ${insightItems.length === 0 ? 'border-t border-border' : ''}`}
      >
        <div className="mx-auto w-full max-w-6xl px-4 py-12 md:py-16">
          <header className="mb-8 md:mb-10">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-navy/70">
              Showcase
            </p>
            <h2 className="mt-2 text-2xl font-bold text-brand-navy md:text-3xl">프로젝트 쇼케이스</h2>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              회원들이 공유한 공개 프로젝트를 검색하고, 태그로 골라볼 수 있습니다.
            </p>
            <div className="mt-6 h-px w-full max-w-md bg-gradient-to-r from-brand-navy/40 to-transparent" />
          </header>
          {showcaseQuery.error && items.length > 0 ? (
            <p className="mb-4 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-900 dark:text-amber-100">
              작성자 표시를 불러오지 못했습니다. 마이그레이션(프로필 공개 조회) 적용 여부를 확인하세요.
            </p>
          ) : null}
          <ProjectGallery projects={galleryItems} />
        </div>
      </main>
    </>
  )
}
