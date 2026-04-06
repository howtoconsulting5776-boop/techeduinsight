import Link from 'next/link'
import { InsightSection } from '@/app/components/insights/InsightSection'
import { LandingSectionHeader } from '@/app/components/landing/LandingSectionHeader'
import { RecentLecturesSection } from '@/app/components/landing/RecentLecturesSection'
import { getCachedSupabaseAuth } from '@/app/lib/supabase/server'
import {
  mapCatalogRowsToLectureListItems,
  type LectureCatalogRow,
} from '@/app/lib/lecture-list-items'
import ProjectGallery from '@/app/components/ProjectGallery'
import type { EduInsight, UserRole } from '@/app/lib/types'
import { getShowcaseGalleryItems } from '@/app/lib/showcase-gallery-data'

export default async function HomePage() {
  const { supabase, user } = await getCachedSupabaseAuth()

  const insightsQuery = supabase
    .from('edu_insights')
    .select('*')
    .eq('is_published', true)
    .order('published_at', { ascending: false })
    .order('sort_priority', { ascending: false })
    .limit(4)

  const { projects: previewItems, hadProfileJoinError } = await getShowcaseGalleryItems(
    supabase,
    user,
    { limit: 3 },
  )

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

  const { data: recentLectureRowsRaw, error: recentLecturesErr } = await supabase.rpc(
    'list_recent_lectures_for_landing',
    { p_limit: 3 },
  )
  if (recentLecturesErr) {
    console.warn('[lectures] home recent:', recentLecturesErr.message)
  }

  let profileRole: UserRole | null = null
  const progressMap: Record<string, number> = {}
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    profileRole = (profile?.role as UserRole) ?? 'MEMBER'

    const { data: hist } = await supabase
      .from('watch_history')
      .select('video_id, progress_pct')
      .eq('user_id', user.id)

    for (const h of hist ?? []) {
      progressMap[h.video_id] = h.progress_pct
    }
  }

  const recentLectureRows = (!recentLecturesErr ? (recentLectureRowsRaw ?? []) : []) as LectureCatalogRow[]
  const recentLectureItems = mapCatalogRowsToLectureListItems(recentLectureRows, {
    profileRole,
    isLoggedIn: !!user,
    progressMap,
  })

  return (
    <>
      <section className="relative overflow-hidden bg-brand-navy px-4 py-20 text-center md:py-28">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_85%_55%_at_50%_-25%,rgba(74,144,217,0.2),transparent_55%)]"
          aria-hidden
        />
        <div className="relative mx-auto max-w-3xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-brand-sky/90">
            Learning platform
          </p>
          <h1 className="mt-5 text-4xl font-bold tracking-tight text-white text-balance md:text-5xl lg:text-[3.25rem] lg:leading-tight">
            TechEdu Insight
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-white/78 md:text-lg">
            AI 프로젝트 공유 및 학습 플랫폼
          </p>
        </div>
      </section>

      {insightItems.length > 0 ? (
        <section
          id="insights"
          aria-label="교육 인사이트"
          className="border-t border-b border-brand-navy/10 bg-muted/45 dark:border-border dark:bg-muted/40"
        >
          <InsightSection items={insightItems} />
        </section>
      ) : null}

      <section
        aria-label="최근 프로젝트"
        className={`bg-white dark:bg-background ${insightItems.length === 0 ? 'border-t border-border' : ''}`}
      >
        <div className="mx-auto w-full max-w-6xl px-4 py-14 md:py-20">
          <LandingSectionHeader
            label="Showcase"
            title="최근 프로젝트"
            description="최근에 공개된 프로젝트입니다. 전체 목록·검색·태그 필터는 쇼케이스에서 이용할 수 있습니다."
            actions={
              <Link
                href="/showcase"
                className="inline-flex items-center justify-center rounded-lg bg-brand-navy px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-navy/90"
              >
                쇼케이스 전체 보기
              </Link>
            }
          />
          {hadProfileJoinError ? (
            <p className="mb-4 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-900 dark:text-amber-100">
              작성자 표시를 불러오지 못했습니다. 마이그레이션(프로필 공개 조회) 적용 여부를 확인하세요.
            </p>
          ) : null}
          <ProjectGallery projects={previewItems} showFilters={false} />
        </div>
      </section>

      <RecentLecturesSection items={recentLectureItems} />
    </>
  )
}
