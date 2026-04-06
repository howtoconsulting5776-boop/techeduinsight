import type { Metadata } from 'next'
import Link from 'next/link'
import { InsightCard } from '@/app/components/insights/InsightCard'
import { LandingSectionHeader } from '@/app/components/landing/LandingSectionHeader'
import { createClient } from '@/app/lib/supabase/server'
import type { EduInsight } from '@/app/lib/types'

export const metadata: Metadata = {
  title: '인사이트 | TechEdu Insight',
  description: '테크·교육 관련 외부 기사 큐레이션. 원문은 각 출처에서 확인하세요.',
}

interface PageProps {
  searchParams: Promise<{ category?: string }>
}

export default async function InsightsPage({ searchParams }: PageProps) {
  const { category } = await searchParams
  const categoryTrim = category?.trim() || ''

  const supabase = await createClient()
  let q = supabase
    .from('edu_insights')
    .select('*')
    .eq('is_published', true)
    .order('published_at', { ascending: false })
    .order('sort_priority', { ascending: false })

  if (categoryTrim) {
    q = q.eq('category', categoryTrim)
  }

  const { data, error } = await q

  if (error) {
    console.warn('[insights] list failed:', error.message)
  }

  const items = (data ?? []) as EduInsight[]

  const { data: catRows } = await supabase
    .from('edu_insights')
    .select('category')
    .eq('is_published', true)
    .not('category', 'is', null)

  const categories = [
    ...new Set(
      (catRows ?? [])
        .map((r) => (r as { category: string | null }).category)
        .filter((c): c is string => Boolean(c?.trim())),
    ),
  ].sort((a, b) => a.localeCompare(b, 'ko'))

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-12 md:py-16">
      <LandingSectionHeader
        label="Insights"
        title="교육 인사이트"
        titleLevel="h1"
        description="외부 언론·기관의 기사 링크를 소개합니다. 본문 전재 없이 요약과 원문 링크만 제공하며, 저작권은 각 출처에 있습니다."
      />

      {categories.length > 0 ? (
        <div className="mb-10 flex flex-wrap gap-2">
          <Link
            href="/insights"
            className={`rounded-full border px-3 py-1 text-sm font-medium transition-colors ${
              !categoryTrim
                ? 'border-brand-navy bg-brand-navy text-white'
                : 'border-border bg-background hover:bg-muted'
            }`}
          >
            전체
          </Link>
          {categories.map((c) => (
            <Link
              key={c}
              href={`/insights?category=${encodeURIComponent(c)}`}
              className={`rounded-full border px-3 py-1 text-sm font-medium transition-colors ${
                categoryTrim === c
                  ? 'border-brand-navy bg-brand-navy text-white'
                  : 'border-border bg-background hover:bg-muted'
              }`}
            >
              {c}
            </Link>
          ))}
        </div>
      ) : null}

      {error ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          목록을 불러오지 못했습니다. DB 마이그레이션 적용 여부를 확인하세요.
        </p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">아직 등록된 인사이트가 없습니다.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((insight) => (
            <InsightCard key={insight.id} insight={insight} />
          ))}
        </div>
      )}
    </main>
  )
}
