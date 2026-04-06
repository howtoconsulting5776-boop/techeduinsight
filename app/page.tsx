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

  const { projects: galleryItems, hadProfileJoinError } = await getShowcaseGalleryItems(
    supabase,
    user,
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
      <section className="relative flex min-h-[min(520px,70svh)] flex-col items-center justify-center overflow-hidden bg-brand-navy px-4 py-14 text-center md:min-h-[min(600px,78svh)] md:py-20">
        <video
          className="hero-video-bg pointer-events-none absolute inset-0 z-0 h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden
        >
          <source src="/hero-whale-bg.mp4" type="video/mp4" />
        </video>
        <div
          className="pointer-events-none absolute inset-0 z-[1] bg-brand-navy/50"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 z-[2] bg-[radial-gradient(ellipse_80%_65%_at_50%_50%,rgba(74,144,217,0.22),transparent_62%)]"
          aria-hidden
        />
        {/* 영상에 박힌 워터마크(예: Veo, 좌상단) 가림 — 없애려면 public/hero-whale-bg.mp4를 무표기 버전으로 교체 */}
        <div
          className="pointer-events-none absolute inset-0 z-[2] bg-[radial-gradient(ellipse_96%_78%_at_0%_0%,rgba(27,58,107,0.99),transparent_92%)]"
          aria-hidden
        />
        <div className="relative z-10 mx-auto flex w-full max-w-2xl flex-col items-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-brand-sky/90">
            Learning platform
          </p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-white text-balance md:mt-5 md:text-5xl lg:text-[3.25rem] lg:leading-tight">
            TechEdu Insight
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-white/78 md:mt-5 md:max-w-xl md:text-lg">
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
        id="showcase"
        aria-label="프로젝트 쇼케이스"
        className={`scroll-mt-20 bg-white dark:bg-background ${insightItems.length === 0 ? 'border-t border-border' : ''}`}
      >
        <div className="mx-auto w-full max-w-6xl px-4 py-14 md:py-20">
          <LandingSectionHeader
            label="Showcase"
            title="프로젝트 쇼케이스"
            description="회원들이 공유한 공개 프로젝트를 검색하고, 태그로 골라볼 수 있습니다."
          />
          {hadProfileJoinError ? (
            <p className="mb-4 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-900 dark:text-amber-100">
              작성자 표시를 불러오지 못했습니다. 마이그레이션(프로필 공개 조회) 적용 여부를 확인하세요.
            </p>
          ) : null}
          <ProjectGallery projects={galleryItems} />
        </div>
      </section>

      <RecentLecturesSection items={recentLectureItems} />
    </>
  )
}
