import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { headers } from 'next/headers'
import { createClient } from '@/app/lib/supabase/server'
import { buildPrivatePageMetadata } from '@/app/lib/seo'
import VideoPlayer from './VideoPlayer'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data: catalog, error } = await supabase.rpc('list_lectures_for_catalog')
  if (error) {
    return buildPrivatePageMetadata({
      title: '강의 시청',
      description: 'TechEdu Insight 강의 시청',
    })
  }
  const rows = (catalog ?? []) as Array<{ id: string; title: string }>
  const row = rows.find((r) => r.id === id)
  const title = row ? `${row.title} 시청` : '강의 시청'
  return buildPrivatePageMetadata({
    title,
    description:
      '로그인 후 시청 가능한 강의 페이지입니다. 개인 시청 맥락 보호를 위해 검색 색인에서 제외됩니다.',
  })
}

async function appOrigin(): Promise<string> {
  const h = await headers()
  const host = h.get('x-forwarded-host') ?? h.get('host')
  const proto = h.get('x-forwarded-proto') ?? 'http'
  if (host) return `${proto}://${host}`
  const env = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '')
  return env ?? 'http://localhost:3000'
}

export default async function WatchPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: catalog, error: cErr } = await supabase.rpc('list_lectures_for_catalog')
  if (cErr) {
    console.error(cErr)
    notFound()
  }

  const rows = (catalog ?? []) as Array<{ id: string; title: string }>
  const row = rows.find((r) => r.id === id)
  if (!row) notFound()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/login?redirectTo=${encodeURIComponent(`/watch/${id}`)}`)
  }

  const origin = await appOrigin()
  const h = await headers()
  const cookie = h.get('cookie') ?? ''

  const res = await fetch(`${origin}/api/get-video-token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: JSON.stringify({ id }),
    cache: 'no-store',
  })

  if (res.status === 401) {
    redirect(`/login?redirectTo=${encodeURIComponent(`/watch/${id}`)}`)
  }

  if (!res.ok) {
    redirect('/pricing')
  }

  const data = (await res.json()) as { token?: string }
  if (!data.token) {
    redirect('/pricing')
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center gap-3 text-sm">
        <Link
          href="/lectures"
          className="font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          ← 강의 목록
        </Link>
        <span className="text-muted-foreground/50">·</span>
        <Link href="/" className="font-medium text-muted-foreground transition-colors hover:text-foreground">
          쇼케이스
        </Link>
      </div>
      <h1 className="mb-6 text-2xl font-bold tracking-tight">{row.title}</h1>
      <VideoPlayer streamToken={data.token} videoRecordId={id} />
    </main>
  )
}
