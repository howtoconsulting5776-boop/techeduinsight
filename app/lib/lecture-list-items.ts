import { getThumbnailUrl } from '@/app/lib/storage'
import type { LectureListItem } from '@/app/lectures/lecture-catalog'
import type { UserRole, VideoRole } from '@/app/lib/types'
import { canWatchLecture, lectureCardHref } from '@/app/lib/video/access'

export type LectureCatalogRow = {
  id: string
  title: string
  category: string | null
  sort_order: number
  duration_sec: number | null
  required_role: VideoRole
  thumbnail_path: string | null
}

export function mapCatalogRowsToLectureListItems(
  rows: LectureCatalogRow[],
  opts: {
    profileRole: UserRole | null
    isLoggedIn: boolean
    progressMap: Record<string, number>
  },
): LectureListItem[] {
  const { profileRole, isLoggedIn, progressMap } = opts
  return rows.map((row) => {
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
      thumbnailUrl: getThumbnailUrl(row.thumbnail_path),
      href,
      locked,
      showPremiumBadge,
      progressPct: progressMap[row.id] ?? null,
    }
  })
}
