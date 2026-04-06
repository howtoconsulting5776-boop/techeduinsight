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
    <article className="flex flex-col overflow-hidden rounded-xl border border-border bg-card text-card-foreground ring-1 ring-foreground/10">
      <Link href={detailHref} className="relative block aspect-video w-full shrink-0 bg-muted">
        {insight.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={insight.image_url}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
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
        <p className="text-xs text-muted-foreground">
          {insight.source_name} · {formatPublishedAt(insight.published_at)}
        </p>
        {insight.summary ? (
          <p className="line-clamp-2 text-sm text-muted-foreground">{insight.summary}</p>
        ) : null}
        <p className="mt-auto pt-2 text-xs text-muted-foreground">
          원문은 외부 사이트에서 제공됩니다.
        </p>
        <div className="flex flex-wrap gap-2">
          <Link
            href={detailHref}
            className="inline-flex w-fit items-center justify-center rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
          >
            자세히 보기
          </Link>
          <a
            href={insight.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-fit items-center justify-center rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            원문 보기
          </a>
        </div>
      </div>
    </article>
  )
}
