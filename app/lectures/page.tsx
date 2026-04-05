import { createClient } from '@/app/lib/supabase/server'
import { canWatchLecture, lectureCardHref } from '@/app/lib/video/access'
import type { UserRole } from '@/app/lib/types'
import type { VideoRole } from '@/app/lib/types'
import LectureCatalog, { type LectureListItem } from './lecture-catalog'

export default async function LecturesPage() {
  const supabase = await createClient()

  const { data: catalog, error } = await supabase.rpc('list_lectures_for_catalog')
  if (error) {
    console.error(error)
  }

  const rows =
    (catalog ?? []) as Array<{
      id: string
      title: string
      category: string | null
      sort_order: number
      duration_sec: number | null
      required_role: VideoRole
    }>

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

  const items: LectureListItem[] = rows.map((row) => {
    const canWatch = canWatchLecture(row.required_role, profileRole, isLoggedIn)
    const href = lectureCardHref({
      videoId: row.id,
      requiredRole: row.required_role,
      isLoggedIn,
      canWatch,
    })
    const locked = !canWatch
    const showPremiumBadge = row.required_role === 'PREMIUM'

    return {
      id: row.id,
      title: row.title,
      category: row.category,
      sort_order: row.sort_order,
      duration_sec: row.duration_sec,
      required_role: row.required_role,
      href,
      locked,
      showPremiumBadge,
      progressPct: progressMap[row.id] ?? null,
    }
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
