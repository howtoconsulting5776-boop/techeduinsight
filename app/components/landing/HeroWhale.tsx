import Image from 'next/image'

/**
 * 랜딩 히어로: 만화풍 범고래 — 부모(히어로) 안을 넓게 도는 CSS 경로 애니메이션
 */
export function HeroWhale() {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-[1] overflow-hidden"
      aria-hidden
    >
      <div className="hero-whale-float absolute bottom-[6%] left-[1%] h-[3.75rem] w-[4.75rem] sm:bottom-[8%] sm:left-[2%] sm:h-16 sm:w-[5.25rem] md:bottom-[10%] md:h-[4.25rem] md:w-28 lg:h-20 lg:w-32">
        <div className="relative h-full w-full">
          <Image
            src="/hero-orca.png"
            alt=""
            width={626}
            height={447}
            className="h-full w-full object-contain object-left-bottom drop-shadow-[0_4px_14px_rgba(0,0,0,0.35)]"
            sizes="(max-width: 640px) 76px, (max-width: 768px) 88px, 128px"
            priority={false}
          />
        </div>
      </div>
    </div>
  )
}
