import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/app/lib/supabase/server'
import type { EduInsight } from '@/app/lib/types'

interface PageProps {
  params: Promise<{ id: string }>
}

function formatPublishedAt(iso: string) {
  try {
    return new Date(iso).toLocaleString('ko-KR', {
      dateStyle: 'long',
    })
  } catch {
    return iso
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('edu_insights')
    .select('title, summary')
    .eq('id', id)
    .eq('is_published', true)
    .maybeSingle()

  if (!data) {
    return {
      title: '인사이트 | TechEdu Insight',
      description: '테크·교육 관련 외부 기사 큐레이션.',
    }
  }

  const row = data as Pick<EduInsight, 'title' | 'summary'>
  const summaryTrim = row.summary?.trim() ?? ''
  const description =
    summaryTrim.length > 0
      ? summaryTrim.slice(0, 160) + (summaryTrim.length > 160 ? '…' : '')
      : '원문은 외부 사이트에서 확인할 수 있습니다.'

  return {
    title: `${row.title} | TechEdu Insight`,
    description,
  }
}

export default async function InsightDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('edu_insights')
    .select('*')
    .eq('id', id)
    .eq('is_published', true)
    .maybeSingle()

  if (error || !data) {
    notFound()
  }

  const insight = data as EduInsight

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10">
      <Link
        href="/insights"
        className="text-sm font-medium text-brand-navy underline-offset-4 hover:underline"
      >
        ← 인사이트 목록
      </Link>

      <article className="mt-6">
        {insight.category ? (
          <p className="text-sm font-medium text-brand-navy">{insight.category}</p>
        ) : null}
        <h1 className="mt-2 text-3xl font-bold leading-tight text-foreground">{insight.title}</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {insight.source_name} · {formatPublishedAt(insight.published_at)}
        </p>

        {insight.image_url ? (
          <div className="relative mt-8 aspect-video w-full overflow-hidden rounded-xl border border-border bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={insight.image_url}
              alt=""
              className="h-full w-full object-cover"
            />
          </div>
        ) : null}

        <div className="mt-8 space-y-4">
          <h2 className="text-lg font-semibold">요약</h2>
          {insight.summary && insight.summary.trim().length > 0 ? (
            <p className="whitespace-pre-wrap text-base leading-relaxed text-foreground">
              {insight.summary}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              등록된 요약이 없습니다. 아래 원문에서 전체 기사를 확인하세요.
            </p>
          )}
        </div>

        {insight.tags && insight.tags.length > 0 ? (
          <div className="mt-8">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              태그
            </p>
            <ul className="flex flex-wrap gap-2">
              {insight.tags.map((tag) => (
                <li
                  key={tag}
                  className="rounded-full border border-border bg-muted/50 px-3 py-1 text-sm text-foreground"
                >
                  {tag}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <p className="mt-10 rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          본문 및 저작권은 각 출처(외부 사이트)에 있습니다. 요약은 서비스 내 큐레이션 목적으로만
          제공됩니다.
        </p>

        <div className="mt-6">
          <a
            href={insight.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            원문 보기
          </a>
        </div>
      </article>
    </main>
  )
}
