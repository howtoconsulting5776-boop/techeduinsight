import { LandingSectionHeader } from '@/app/components/landing/LandingSectionHeader'
import { getCachedSupabaseAuth } from '@/app/lib/supabase/server'
import ProjectGallery from '@/app/components/ProjectGallery'
import { getShowcaseGalleryItems } from '@/app/lib/showcase-gallery-data'

export default async function HomePage() {
  const { supabase, user } = await getCachedSupabaseAuth()

  const { projects: galleryItems, hadProfileJoinError } = await getShowcaseGalleryItems(
    supabase,
    user,
  )

  return (
    <>
      <section className="relative flex min-h-[min(520px,70svh)] flex-col items-center justify-center overflow-hidden bg-brand-navy px-4 py-14 text-center md:min-h-[min(600px,78svh)] md:py-20">
        <video
          className="hero-video-bg pointer-events-none absolute inset-0 z-0 h-full w-full bg-brand-navy object-contain object-center"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden
        >
          <source src="/hero-whale-bg.mp4" type="video/mp4" />
        </video>
        {/* object-contain 여백·인코딩 테두리로 보이는 검은 선 가림 */}
        <div
          className="pointer-events-none absolute inset-y-0 left-0 z-[1] w-[max(12px,min(3.5vw,32px))] bg-brand-navy"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-y-0 right-0 z-[1] w-[max(12px,min(3.5vw,32px))] bg-brand-navy"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-[max(10px,min(2.5vh,24px))] bg-brand-navy"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-[max(10px,min(2.5vh,24px))] bg-brand-navy"
          aria-hidden
        />
        {/* Veo 등 코너 워터마크 가림 (코어를 더 진·넓게) */}
        <div
          className="pointer-events-none absolute left-0 top-0 z-[2] h-[min(48%,340px)] w-[min(62%,420px)] bg-[radial-gradient(ellipse_120%_120%_at_0%_0%,#1B3A6B_0%,#1B3A6B_14%,rgba(27,58,107,0.98)_28%,rgba(27,58,107,0.88)_44%,rgba(27,58,107,0.45)_62%,transparent_82%)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute bottom-0 right-0 z-[2] h-[min(48%,340px)] w-[min(62%,420px)] bg-[radial-gradient(ellipse_120%_120%_at_100%_100%,#1B3A6B_0%,#1B3A6B_14%,rgba(27,58,107,0.98)_28%,rgba(27,58,107,0.88)_44%,rgba(27,58,107,0.45)_62%,transparent_82%)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 z-[3] bg-brand-navy/40"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 z-[4] bg-[radial-gradient(ellipse_75%_60%_at_50%_45%,rgba(74,144,217,0.12),transparent_65%)]"
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

      <section
        id="showcase"
        aria-label="프로젝트 쇼케이스"
        className="scroll-mt-20 border-t border-border bg-white dark:bg-background"
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
    </>
  )
}
