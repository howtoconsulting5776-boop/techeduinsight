import { getSupabaseUrl } from '@/app/lib/supabase/env'

/**
 * Returns the public URL for a thumbnail stored in Supabase Storage.
 * Returns null when thumbnail_path is falsy.
 */
export function getThumbnailUrl(thumbnailPath: string | null | undefined): string | null {
  if (!thumbnailPath) return null
  const supabaseUrl = getSupabaseUrl()
  return `${supabaseUrl}/storage/v1/object/public/thumbnails/${thumbnailPath}`
}
