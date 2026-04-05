import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getCachedSupabaseAuth } from '@/app/lib/supabase/server'
import { ProjectCardThumbnail } from '@/app/components/ProjectCardThumbnail'
import { ProjectCommentForm } from '@/app/components/ProjectCommentForm'
import { ProjectCommentThread } from '@/app/components/ProjectCommentThread'
import { ProjectSocialBar } from '@/app/components/ProjectSocialBar'
import { getThumbnailUrl } from '@/app/lib/storage'
import type { ProjectCommentRow, ProjectWithProfile } from '@/app/lib/types'

interface PageProps {
  params: Promise<{ id: string }>
}

/** 세션·댓글 등 사용자별 데이터가 섞이지 않도록 캐시 비활성화 */
export const dynamic = 'force-dynamic'

export default async function ProjectDetailPage({ params }: PageProps) {
  const { id } = await params
  const { supabase, user } = await getCachedSupabaseAuth()

  const { data: project, error } = await supabase
    .from('projects')
    .select('*, profiles(display_name, avatar_url)')
    .eq('id', id)
    .single()

  if (error || !project) notFound()

  const p = project as ProjectWithProfile

  let viewCount = p.view_count
  const { data: rpcViewCount, error: incErr } = await supabase.rpc('increment_project_view', {
    project_id: id,
  })
  if (!incErr && rpcViewCount != null && !Number.isNaN(Number(rpcViewCount))) {
    viewCount = Number(rpcViewCount)
  } else if (!incErr) {
    const { data: countRow } = await supabase
      .from('projects')
      .select('view_count')
      .eq('id', id)
      .single()
    if (countRow) viewCount = countRow.view_count
  }

  const thumbUrl = getThumbnailUrl(p.thumbnail_path)
  const author =
    typeof p.profiles?.display_name === 'string' && p.profiles.display_name.trim()
      ? p.profiles.display_name.trim()
      : '알 수 없음'

  const site = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, '') ?? ''
  const shareUrl = site ? `${site}/projects/${id}` : `/projects/${id}`

  const { count: likesCountRaw } = await supabase
    .from('project_likes')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', id)
  const likesCount = likesCountRaw ?? 0

  const { count: commentsCountRaw } = await supabase
    .from('project_comments')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', id)
  const commentsCount = commentsCountRaw ?? 0

  let likedByMe = false
  if (user) {
    const { data: likeRow } = await supabase
      .from('project_likes')
      .select('project_id')
      .eq('project_id', id)
      .eq('user_id', user.id)
      .maybeSingle()
    likedByMe = !!likeRow
  }

  let viewerIsAdmin = false
  if (user) {
    const { data: me } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()
    viewerIsAdmin = me?.role === 'ADMIN'
  }

  const commentQuery = await supabase
    .from('project_comments')
    .select('id, project_id, user_id, parent_id, body, author_display_name, created_at')
    .eq('project_id', id)
    .order('created_at', { ascending: true })

  type CommentRowDb = {
    id: string
    project_id: string
    user_id: string
    parent_id?: string | null
    body: string
    author_display_name: string
    created_at: string
  }

  let rawRows: CommentRowDb[] | null = commentQuery.data as CommentRowDb[] | null
  if (commentQuery.error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[project comments] select with parent_id:', commentQuery.error.message)
    }
    const fb = await supabase
      .from('project_comments')
      .select('id, project_id, user_id, body, author_display_name, created_at')
      .eq('project_id', id)
      .order('created_at', { ascending: true })
    rawRows = fb.error ? null : (fb.data as CommentRowDb[] | null)
    if (fb.error && process.env.NODE_ENV === 'development') {
      console.warn('[project comments] fallback select:', fb.error.message)
    }
  }

  const comments: ProjectCommentRow[] = (rawRows ?? []).map((r) => ({
    id: r.id as string,
    project_id: r.project_id as string,
    user_id: r.user_id as string,
    parent_id: r.parent_id ?? null,
    body: r.body as string,
    author_display_name: r.author_display_name as string,
    created_at: r.created_at as string,
  }))

  return (
    <>
      <main className="mx-auto w-full max-w-4xl px-4 py-10">
        <Link
          href="/#showcase"
          className="mb-6 inline-flex text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          ← 갤러리로 돌아가기
        </Link>

        <div className="overflow-hidden rounded-xl border">
          {thumbUrl ? (
            <ProjectCardThumbnail src={thumbUrl} alt={p.title} />
          ) : (
            <div className="aspect-video w-full bg-[linear-gradient(135deg,var(--brand-navy),var(--brand-sky))]" />
          )}
        </div>

        {/* ── 세부 정보 (제목·메타·설명) ── */}
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

          {p.description && (
            <p className="mt-6 leading-relaxed text-foreground/80">{p.description}</p>
          )}
        </div>

        {/* ── 좋아요·댓글·공유 (상세 페이지 URL 공유) ── */}
        <div className="mt-6 overflow-hidden rounded-xl border">
          <ProjectSocialBar
            projectId={id}
            shareUrl={shareUrl}
            commentsHref="#comments"
            initialLikesCount={likesCount}
            initialLiked={likedByMe}
            commentsCount={commentsCount}
          />
        </div>

        {/* ── 프로젝트 체험 (댓글보다 위) ── */}
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

        {/* ── 댓글 (작성 순·답글 트리) ── */}
        <section id="comments" className="mt-10 scroll-mt-24">
          <h2 className="text-xl font-semibold">
            댓글 {commentsCount > 0 ? `· ${commentsCount}` : ''}
          </h2>

          <div className="mt-4">
            <ProjectCommentThread
              comments={comments}
              projectId={id}
              userLoggedIn={!!user}
              currentUserId={user?.id ?? null}
              viewerIsAdmin={viewerIsAdmin}
            />
          </div>

          <div className="mt-6 rounded-xl border border-dashed border-border bg-muted/20 p-4">
            {user ? (
              <ProjectCommentForm projectId={id} />
            ) : (
              <p className="text-sm text-muted-foreground">
                댓글을 남기려면{' '}
                <Link
                  href={`/login?redirectTo=${encodeURIComponent(`/projects/${id}#comments`)}`}
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  로그인
                </Link>
                하세요.
              </p>
            )}
          </div>
        </section>
      </main>
    </>
  )
}
