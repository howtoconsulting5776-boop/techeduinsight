import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface LandingSectionHeaderProps {
  /** 짧은 영문 라벨 (대문자 + 자간) */
  label: string
  title: string
  description?: string
  /** 규칙선 표시 */
  showRule?: boolean
  /** 오른쪽 액션(예: 더 보기 링크) */
  actions?: ReactNode
  align?: 'left' | 'center'
  /** 페이지 최상단 제목이면 h1 (접근성·SEO) */
  titleLevel?: 'h1' | 'h2'
  className?: string
}

/**
 * 랜딩·목록 공통: 라벨 → 제목 → 설명 + 선택적 액션.
 * (Linear류 제품 페이지의 위계를 브랜드 네이비 톤으로 재해석)
 */
export function LandingSectionHeader({
  label,
  title,
  description,
  showRule = true,
  actions,
  align = 'left',
  titleLevel = 'h2',
  className,
}: LandingSectionHeaderProps) {
  const isCenter = align === 'center'
  const TitleTag = titleLevel === 'h1' ? 'h1' : 'h2'

  return (
    <header className={cn('mb-8 md:mb-10', isCenter && 'flex flex-col items-center text-center', className)}>
      <div
        className={cn(
          'flex w-full flex-col gap-4',
          !isCenter && 'sm:flex-row sm:items-end sm:justify-between',
          isCenter && 'items-center',
        )}
      >
        <div className={cn('min-w-0', isCenter && 'flex flex-col items-center')}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-navy/65">
            {label}
          </p>
          <TitleTag className="mt-2 text-2xl font-bold tracking-tight text-brand-navy md:text-3xl">
            {title}
          </TitleTag>
          {description ? (
            <p
              className={cn(
                'mt-2 max-w-2xl text-[15px] leading-relaxed text-muted-foreground',
                isCenter && 'mx-auto',
              )}
            >
              {description}
            </p>
          ) : null}
        </div>
        {actions ? (
          <div className={cn('shrink-0', !isCenter && 'sm:pb-0.5')}>{actions}</div>
        ) : null}
      </div>
      {showRule ? (
        <div
          className={cn(
            'mt-6 h-px bg-gradient-to-r from-brand-navy/35 to-transparent',
            isCenter ? 'mx-auto w-full max-w-md' : 'max-w-md',
          )}
          aria-hidden
        />
      ) : null}
    </header>
  )
}
