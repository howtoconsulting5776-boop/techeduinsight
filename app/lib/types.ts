export type UserRole = 'GUEST' | 'MEMBER' | 'PREMIUM' | 'TEACHER' | 'ADMIN'
export type ProjectStatus = 'draft' | 'published'
export type VideoRole = 'MEMBER' | 'PREMIUM'

export interface Profile {
  id: string
  role: UserRole
  display_name: string | null
  avatar_url: string | null
  created_at: string
}

export interface Project {
  id: string
  owner_id: string
  title: string
  description: string | null
  deploy_url: string | null
  iframe_allowed: boolean
  thumbnail_path: string | null
  tags: string[] | null
  status: ProjectStatus
  view_count: number
  /** `project_share_events` 트리거로 누적 (012 마이그레이션) */
  share_count?: number
  created_at: string
}

export interface ProjectWithProfile extends Project {
  profiles: Pick<Profile, 'display_name' | 'avatar_url'>
}

/** 쇼케이스 카드용: 좋아요·댓글 수 및 현재 사용자 좋아요 여부 */
export interface ProjectGalleryItem extends ProjectWithProfile {
  likes_count: number
  comments_count: number
  share_count: number
  liked_by_me: boolean
  share_url: string
}

export interface ProjectCommentRow {
  id: string
  project_id: string
  /** 삭제 버튼(본인·관리자) 판별용 */
  user_id: string
  parent_id: string | null
  body: string
  author_display_name: string
  created_at: string
}

export interface Video {
  id: string
  youtube_id: string
  title: string
  required_role: VideoRole
  category: string | null
  sort_order: number
  duration_sec: number | null
  thumbnail_path: string | null
  created_at: string
}

export interface WatchHistory {
  id: string
  user_id: string
  video_id: string
  progress_pct: number
  completed_at: string | null
  updated_at: string
}
