import Image from 'next/image'

/** 프로젝트 카드 그리드(1 / md:2 / xl:3) 기본값 */
export const PROJECT_CARD_IMAGE_SIZES =
  '(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw'

/** 프로젝트 상세(max-w-4xl) 히어로 썸네일 */
export const PROJECT_DETAIL_IMAGE_SIZES = '(max-width: 896px) 100vw, 896px'

/**
 * 16:9 고정 비율(aspect-video) + object-cover — 업로드 시 같은 비율로 자른 썸네일과 맞춤.
 * Supabase 공개 URL은 Next 이미지 최적화(리사이즈·포맷)를 거칩니다.
 */
export function ProjectCardThumbnail({
  src,
  alt,
  hoverScale = false,
  sizes = PROJECT_CARD_IMAGE_SIZES,
  priority = false,
}: {
  src: string
  alt: string
  hoverScale?: boolean
  /** 뷰포트별 디스플레이 폭 힌트 — LCP·대역폭에 직접 영향 */
  sizes?: string
  /** 첫 화면 위쪽 카드 등 LCP 후보에만 사용 */
  priority?: boolean
}) {
  return (
    <div className="relative aspect-video w-full overflow-hidden bg-muted">
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        className={
          hoverScale
            ? 'object-cover object-center transition-transform duration-300 group-hover:scale-105'
            : 'object-cover object-center'
        }
      />
    </div>
  )
}
