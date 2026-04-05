/**
 * 16:9 고정 비율(aspect-video) + object-cover — 업로드 시 같은 비율로 자른 썸네일과 맞춤.
 */
export function ProjectCardThumbnail({
  src,
  alt,
  hoverScale = false,
}: {
  src: string
  alt: string
  /** 부모에 `group`이 있을 때만 살짝 확대 */
  hoverScale?: boolean
}) {
  return (
    <div className="relative aspect-video w-full overflow-hidden bg-muted">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className={
          hoverScale
            ? 'h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105'
            : 'h-full w-full object-cover object-center'
        }
      />
    </div>
  )
}
