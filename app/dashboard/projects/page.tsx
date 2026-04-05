import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/app/lib/supabase/server'
import { getThumbnailUrl } from '@/app/lib/storage'
import type { Project } from '@/app/lib/types'

function StatusBadge({ status }: { status: Project['status'] }) {
  if (status === 'published') {
    return (
      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">
        공개됨
      </span>
    )
  }
  return (
    <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
      검토중
    </span>
  )
}

function ThumbnailPlaceholder() {
  return (
    <div className="h-40 w-full rounded-t-lg bg-[linear-gradient(135deg,#1e3a5f,#38bdf8)]" />
  )
}

export default async function MyProjectsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: projects, error } = await supabase
    .from('projects')
    .select('*')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })

  const items = (projects ?? []) as Project[]

  return (
    <main className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">내 프로젝트</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              등록된 프로젝트 {items.length}개
            </p>
          </div>
          <Link
            href="/dashboard/projects/new"
            className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            + 새 프로젝트 등록
          </Link>
        </div>

        {error && (
          <p className="mb-6 rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
            데이터를 불러오는 중 오류가 발생했습니다: {error.message}
          </p>
        )}

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-20 text-center">
            <p className="text-lg font-medium">아직 등록된 프로젝트가 없습니다</p>
            <p className="mt-1 text-sm text-muted-foreground">
              첫 번째 프로젝트를 등록해 보세요!
            </p>
            <Link
              href="/dashboard/projects/new"
              className="mt-6 inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              프로젝트 등록하기
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {items.map((project) => {
              const thumbUrl = getThumbnailUrl(project.thumbnail_path)
              return (
                <div
                  key={project.id}
                  className="group overflow-hidden rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-md"
                >
                  {/* Thumbnail */}
                  {thumbUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={thumbUrl}
                      alt={project.title}
                      className="h-40 w-full object-cover"
                    />
                  ) : (
                    <ThumbnailPlaceholder />
                  )}

                  {/* Body */}
                  <div className="p-4">
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <h2 className="line-clamp-1 font-semibold">{project.title}</h2>
                      <StatusBadge status={project.status} />
                    </div>

                    {project.description && (
                      <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">
                        {project.description}
                      </p>
                    )}

                    {/* Tags */}
                    {project.tags && project.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {project.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="mt-4 flex flex-col gap-2">
                      <Link
                        href={`/projects/${project.id}`}
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        공개 상세 보기 →
                      </Link>
                      <Link
                        href={`/dashboard/projects/${project.id}/edit`}
                        className="text-sm font-medium text-muted-foreground hover:text-foreground hover:underline"
                      >
                        {project.status === 'draft' ? '초안 편집' : '프로젝트 수정'}
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Back to dashboard */}
        <div className="mt-10">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-50"
          >
            ← 대시보드로 돌아가기
          </Link>
        </div>
      </div>
    </main>
  )
}
