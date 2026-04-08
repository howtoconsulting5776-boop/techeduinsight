import Image from 'next/image'
import Link from 'next/link'
import type { EduInsight } from '@/app/lib/types'

function formatPublishedAt(iso: string) {
  try {
    return new Date(iso).toLocaleString('ko-KR', {
      dateStyle: 'medium',
    })
  } catch {
    return iso
  }
}

export function InsightCard({ insight }: { insight: EduInsight }) {
  const detailHref = `/insights/${insight.id}`

  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-border/80 bg-card text-card-foreground shadow-sm transition-all duration-200 hover:border-brand-navy/20 hover:shadow-md">
      <Link
        href={detailHref}
        className="relative block aspect-video w-full shrink-0 cursor-pointer bg-muted outline-none ring-brand-navy transition-opacity hover:opacity-95 focus-visible:ring-2 focus-visible:ring-offset-2"
        aria-label={`${insight.title} 상세 보기`}
      >
        {insight.image_url ? (
          <Image
            src={insight.image_url}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,var(--brand-navy),var(--brand-sky))] text-xs font-medium text-white/90">
            TechEdu Insight
          </div>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-4">
        {insight.category ? (
          <span className="text-xs font-medium text-brand-navy">{insight.category}</span>
        ) : null}
        <h2 className="line-clamp-2 text-base font-semibold leading-snug">
          <Link
            href={detailHref}
            className="text-foreground transition-colors hover:text-brand-navy hover:underline"
          >
            {insight.title}
          </Link>
        </h2>
        <p className="mt-auto text-xs text-muted-foreground">
          {insight.source_name} · {formatPublishedAt(insight.published_at)}
        </p>
      </div>
    </article>
  )
}
