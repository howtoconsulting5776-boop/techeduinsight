/** PostgREST / Supabase when `videos.thumbnail_path` (or RPC) is not migrated yet */
export function isMissingVideosThumbnailColumnError(message: string | undefined | null): boolean {
  if (!message) return false
  const m = message.toLowerCase()
  return (
    m.includes('thumbnail_path') ||
    m.includes('schema cache') ||
    m.includes('pgrst204')
  )
}

export const VIDEO_THUMB_MIGRATION_HINT =
  'Supabase → SQL Editor에서 `supabase/migrations/007_lecture_thumbnails.sql` 전체를 실행한 뒤, 잠시 기다리거나 프로젝트를 새로고침하세요. (videos.thumbnail_path 컬럼 + list_lectures_for_catalog 함수 갱신)'
