import { getSupabaseUrl } from '@/app/lib/supabase/env'

/** 업로드 시 `cacheControl` — 브라우저/CDN 장기 캐시 (초 단위, 1년) */
export const THUMBNAIL_UPLOAD_CACHE_CONTROL = '31536000'

/**
 * 카드·상세 썸네일용 변환 크기 (2x 레티나 대비, 16:9).
 * Supabase Image Transform(Pro) 사용 시 원본보다 작은 바이트로 내려받음.
 */
export const THUMBNAIL_TRANSFORM_DISPLAY = { width: 960, height: 540 } as const

function encodeStorageObjectPath(path: string): string {
  return path
    .split('/')
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join('/')
}

function useStorageImageTransform(): boolean {
  return process.env.NEXT_PUBLIC_SUPABASE_IMAGE_TRANSFORM === 'true'
}

/**
 * 공개 썸네일 URL.
 * `NEXT_PUBLIC_SUPABASE_IMAGE_TRANSFORM=true` 이고 Supabase에서 Image Transform이 켜져 있으면
 * `/storage/v1/render/image/public/...` URL을 사용합니다 (Pro 기능).
 */
export function getThumbnailUrl(
  thumbnailPath: string | null | undefined,
  transform: { width: number; height: number } = THUMBNAIL_TRANSFORM_DISPLAY,
): string | null {
  if (!thumbnailPath) return null
  const base = getSupabaseUrl().replace(/\/$/, '')

  if (useStorageImageTransform()) {
    const encoded = encodeStorageObjectPath(thumbnailPath)
    const q = new URLSearchParams({
      width: String(transform.width),
      height: String(transform.height),
      resize: 'cover',
      quality: '82',
    })
    return `${base}/storage/v1/render/image/public/thumbnails/${encoded}?${q.toString()}`
  }

  return `${base}/storage/v1/object/public/thumbnails/${thumbnailPath}`
}
