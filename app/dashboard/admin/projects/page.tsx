import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/app/lib/supabase/server'
import { approveProject, updatePublishedIframe } from './actions'
import { Button } from '@/components/ui/button'
import type { ProjectWithProfile } from '@/app/lib/types'

interface PageProps {
  searchParams: Promise<{ err?: string }>
}

export default async function AdminProjectsPage({ searchParams }: PageProps) {
  const { err: errParam } = await searchParams
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'ADMIN') redirect('/dashboard')

  const { data: drafts } = await supabase
    .from('projects')
    .select('*, profiles(display_name)')
    .eq('status', 'draft')
    .order('created_at', { ascending: false })

  const { data: published } = await supabase
    .from('projects')
    .select('*, profiles(display_name)')
    .eq('status', 'published')
    .order('created_at', { ascending: false })

  const draftList = (drafts ?? []) as ProjectWithProfile[]
  const publishedList = (published ?? []) as ProjectWithProfile[]

  return (
    <main className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto max-w-4xl space-y-10">
        {errParam ? (
          <p className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {(() => {
              try {
                return decodeURIComponent(errParam)
              } catch {
                return errParam
              }
            })()}
          </p>
        ) : null}

        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">관리자 · 프로젝트 심사</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              초안을 검토한 뒤 공개하고 iframe 허용 여부를 설정합니다.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            대시보드
          </Link>
        </div>

        <section>
          <h2 className="mb-4 text-lg font-semibold">
            검토 대기 <span className="text-muted-foreground">({draftList.length})</span>
          </h2>
          {draftList.length === 0 ? (
            <p className="rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">
              대기 중인 초안이 없습니다.
            </p>
          ) : (
            <ul className="space-y-6">
              {draftList.map((row) => (
                <li
                  key={row.id}
                  className="rounded-xl border bg-card p-5 shadow-sm"
                >
                  <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold">{row.title}</h3>
                      <p className="text-xs text-muted-foreground">
                        작성자 {row.profiles?.display_name ?? '—'} · 제출일{' '}
                        {new Date(row.created_at).toLocaleString('ko-KR', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </p>
                      {row.deploy_url && (
                        <a
                          href={row.deploy_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 inline-block text-sm text-primary underline-offset-4 hover:underline"
                        >
                          배포 URL 열기 ↗
                        </a>
                      )}
                    </div>
                    <Link
                      href={`/projects/${row.id}`}
                      className="text-sm text-muted-foreground hover:text-foreground hover:underline"
                    >
                      상세(소유자·관리자)
                    </Link>
                  </div>
                  {row.description && (
                    <p className="mb-4 line-clamp-3 text-sm text-muted-foreground">
                      {row.description}
                    </p>
                  )}
                  <form action={approveProject} className="flex flex-wrap items-center gap-4 border-t pt-4">
                    <input type="hidden" name="id" value={row.id} />
                    <label className="flex cursor-pointer items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        name="iframe_allowed"
                        defaultChecked={row.iframe_allowed}
                        className="h-4 w-4 rounded border-input accent-primary"
                      />
                      <span>공개 후 iframe 미리보기 허용</span>
                    </label>
                    <Button type="submit" size="sm">
                      승인 · 공개
                    </Button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold">
            공개됨 <span className="text-muted-foreground">({publishedList.length})</span>
          </h2>
          {publishedList.length === 0 ? (
            <p className="text-sm text-muted-foreground">공개된 프로젝트가 없습니다.</p>
          ) : (
            <ul className="space-y-4">
              {publishedList.map((row) => (
                <li
                  key={row.id}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-lg border px-4 py-3"
                >
                  <div>
                    <span className="font-medium">{row.title}</span>
                    <Link
                      href={`/projects/${row.id}`}
                      className="ml-2 text-sm text-primary hover:underline"
                    >
                      보기
                    </Link>
                  </div>
                  <form action={updatePublishedIframe} className="flex items-center gap-3">
                    <input type="hidden" name="id" value={row.id} />
                    <label className="flex cursor-pointer items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        name="iframe_allowed"
                        defaultChecked={row.iframe_allowed}
                        className="h-4 w-4 rounded border-input accent-primary"
                      />
                      iframe 허용
                    </label>
                    <Button type="submit" variant="outline" size="sm">
                      저장
                    </Button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  )
}
