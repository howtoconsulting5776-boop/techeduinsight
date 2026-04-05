import type { UserRole } from '@/app/lib/types'
import type { VideoRole } from '@/app/lib/types'

export function canWatchLecture(
  requiredRole: VideoRole,
  profileRole: UserRole | null,
  isLoggedIn: boolean,
): boolean {
  if (!isLoggedIn) return false
  if (requiredRole === 'MEMBER') return true
  return ['PREMIUM', 'TEACHER', 'ADMIN'].includes(profileRole ?? 'MEMBER')
}

export function lectureCardHref(args: {
  videoId: string
  requiredRole: VideoRole
  isLoggedIn: boolean
  canWatch: boolean
}): string {
  const { videoId, requiredRole, isLoggedIn, canWatch } = args
  const watchPath = `/watch/${videoId}`

  if (canWatch) return watchPath

  if (!isLoggedIn) {
    if (requiredRole === 'PREMIUM') return '/pricing'
    return `/login?redirectTo=${encodeURIComponent(watchPath)}`
  }

  if (requiredRole === 'PREMIUM') return '/pricing'
  return watchPath
}
