import { createClient } from '@/app/lib/supabase/server'
import { buildPublicPageMetadata } from '@/app/lib/seo'
import {
  mapCatalogRowsToLectureListItems,
  type LectureCatalogRow,
} from '@/app/lib/lecture-list-items'
import type { UserRole } from '@/app/lib/types'
import LectureCatalog, { type LectureListItem } from './lecture-catalog'

export const metadata = buildPublicPageMetadata({
  title: '바이트코딩·온라인 강의',
  description:
    'TechEdu Insight 바이트코딩 강의 카탈로그. Edutech·AI 실습형 학습, 학원·입시·진로 준비에 맞춘 멤버십 강의를 만나보세요.',
  path: '/lectures',
  extraKeywords: ['온라인 코딩', '영상 강의', 'PREMIUM'],
  useTitleTemplate: true,
})

export default async function LecturesPage() {
  const supabase = await createClient()

  const { data: catalog, error } = await supabase.rpc('list_lectures_for_catalog')
  if (error) {
    console.error(error)
  }

  const rows = (catalog ?? []) as LectureCatalogRow[]

  const {
    data: { user },
  } = await supabase.auth.getUser()

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

  const isLoggedIn = !!user

  const items: LectureListItem[] = mapCatalogRowsToLectureListItems(rows, {
    profileRole,
    isLoggedIn,
    progressMap,
  })

  items.sort((a, b) => a.sort_order - b.sort_order || a.title.localeCompare(b.title, 'ko'))

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold tracking-tight">강의</h1>
        <p className="mt-2 text-muted-foreground">
          카테고리별로 강의를 선택해 시청하세요. PREMIUM 강의는 멤버십이 필요합니다.
        </p>
      </div>

      <LectureCatalog items={items} />
    </main>
  )
}
