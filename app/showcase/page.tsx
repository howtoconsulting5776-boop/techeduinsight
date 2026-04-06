import type { Metadata } from 'next'
import Link from 'next/link'
import { LandingSectionHeader } from '@/app/components/landing/LandingSectionHeader'
import ProjectGallery from '@/app/components/ProjectGallery'
import { getShowcaseGalleryItems } from '@/app/lib/showcase-gallery-data'
import { getCachedSupabaseAuth } from '@/app/lib/supabase/server'

export const metadata: Metadata = {
  title: '프로젝트 쇼케이스',
  description: '회원들이 공유한 공개 프로젝트를 검색하고, 태그로 골라볼 수 있습니다.',
}

export default async function ShowcasePage() {
  const { supabase, user } = await getCachedSupabaseAuth()
  const { projects: galleryItems, hadProfileJoinError } = await getShowcaseGalleryItems(
    supabase,
    user,
  )

  return (
    <main className="scroll-mt-20 border-t border-border bg-background">
      <div className="mx-auto w-full max-w-6xl px-4 py-14 md:py-20">
        <LandingSectionHeader
          label="Showcase"
          title="프로젝트 쇼케이스"
          description="회원들이 공유한 공개 프로젝트를 검색하고, 태그로 골라볼 수 있습니다."
          actions={
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              홈으로
            </Link>
          }
        />
        {hadProfileJoinError ? (
          <p className="mb-4 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-900 dark:text-amber-100">
            작성자 표시를 불러오지 못했습니다. 마이그레이션(프로필 공개 조회) 적용 여부를 확인하세요.
          </p>
        ) : null}
        <ProjectGallery projects={galleryItems} />
      </div>
    </main>
  )
}
