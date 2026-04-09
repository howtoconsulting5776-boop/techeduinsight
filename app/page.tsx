import { LandingSectionHeader } from '@/app/components/landing/LandingSectionHeader'
import { getCachedSupabaseAuth } from '@/app/lib/supabase/server'
import ProjectGallery from '@/app/components/ProjectGallery'
import { getShowcaseGalleryItems } from '@/app/lib/showcase-gallery-data'
import { buildPublicPageMetadata } from '@/app/lib/seo'

export const metadata = buildPublicPageMetadata({
  title:
    'TechEdu Insight — Edutech·AI 프로젝트 쇼케이스 & 바이트코딩 강의',
  description:
    'Edutech 플랫폼 TechEdu Insight. AI·진로·입시에 맞춘 공개 프로젝트 쇼케이스, 바이브코딩·바이트코딩 스타일 강의, 교육 인사이트를 제공합니다.',
  path: '/',
  extraKeywords: ['프로젝트 쇼케이스', '온라인 강의', 'TechEdu'],
  useTitleTemplate: false,
})

export default async function HomePage() {
  const { supabase, user } = await getCachedSupabaseAuth()

  const { projects: galleryItems } = await getShowcaseGalleryItems(supabase, user)

  return (
    <>
      <section className="relative flex min-h-[min(520px,70svh)] flex-col items-center justify-center overflow-hidden bg-brand-navy px-4 py-14 text-center md:min-h-[min(600px,78svh)] md:py-20">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_65%_at_50%_50%,rgba(74,144,217,0.22),transparent_62%)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_96%_78%_at_0%_100%,rgba(27,58,107,0.55),transparent_55%)]"
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
          <ProjectGallery projects={galleryItems} />
        </div>
      </section>
    </>
  )
}
