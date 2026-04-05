import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/app/lib/supabase/server'
import { getThumbnailUrl } from '@/app/lib/storage'
import type { ProjectWithProfile } from '@/app/lib/types'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: project, error } = await supabase
    .from('projects')
    .select('*, profiles(display_name, avatar_url)')
    .eq('id', id)
    .single()

  if (error || !project) notFound()

  const p = project as ProjectWithProfile

  let viewCount = p.view_count
  const { error: incErr } = await supabase.rpc('increment_project_view', {
    project_id: id,
  })
  if (!incErr) {
    const { data: countRow } = await supabase
      .from('projects')
      .select('view_count')
      .eq('id', id)
      .single()
    if (countRow) viewCount = countRow.view_count
  }

  const thumbUrl = getThumbnailUrl(p.thumbnail_path)
  const author = p.profiles?.display_name ?? '알 수 없음'

  return (
    <>
      <main className="mx-auto w-full max-w-4xl px-4 py-10">
        <Link
          href="/#showcase"
          className="mb-6 inline-flex text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          ← 갤러리로 돌아가기
        </Link>
        {/* ── Hero thumbnail ── */}
        <div className="overflow-hidden rounded-xl border">
          {thumbUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={thumbUrl}
              alt={p.title}
              className="h-64 w-full object-cover"
            />
          ) : (
            <div className="h-64 w-full bg-[linear-gradient(135deg,var(--brand-navy),var(--brand-sky))]" />
          )}
        </div>

        {/* ── Meta ── */}
        <div className="mt-6">
          <h1 className="text-3xl font-bold">{p.title}</h1>

          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span>by {author}</span>
            <span>·</span>
            <span>조회수 {viewCount.toLocaleString()}</span>
            <span>·</span>
            <span>
              {new Date(p.created_at).toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>

          {/* Tags */}
          {p.tags && p.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {p.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Description */}
          {p.description && (
            <p className="mt-6 leading-relaxed text-foreground/80">{p.description}</p>
          )}
        </div>

        {/* ── Demo: logged-in only (PRD); iframe vs new-tab link fallback ── */}
        {p.deploy_url && (
          <section className="mt-10">
            <h2 className="mb-4 text-xl font-semibold">프로젝트 체험</h2>

            {!user ? (
              <div className="rounded-xl border bg-muted/40 px-6 py-12 text-center">
                <p className="text-muted-foreground">
                  배포 미리보기와 체험은 로그인 후 이용할 수 있습니다.
                </p>
                <Link
                  href={`/login?redirectTo=${encodeURIComponent(`/projects/${id}`)}`}
                  className="mt-5 inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  로그인하고 체험하기
                </Link>
              </div>
            ) : p.iframe_allowed ? (
              <div className="overflow-hidden rounded-xl border shadow-sm">
                <iframe
                  src={p.deploy_url}
                  title={p.title}
                  className="h-[600px] w-full border-0 bg-background"
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-xl border bg-muted/40 py-16 text-center">
                <p className="mb-4 text-muted-foreground">
                  새 탭에서 배포 사이트를 엽니다 (iframe이 허용되지 않은 경우의 안전한 폴백)
                </p>
                <a
                  href={p.deploy_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  새 탭에서 체험하기 ↗
                </a>
              </div>
            )}
          </section>
        )}
      </main>
    </>
  )
}
