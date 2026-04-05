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
  created_at: string
}

export interface ProjectWithProfile extends Project {
  profiles: Pick<Profile, 'display_name' | 'avatar_url'>
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
