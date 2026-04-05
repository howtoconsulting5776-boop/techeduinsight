import Link from 'next/link'
import { createClient } from '@/app/lib/supabase/server'
import ProjectGallery from '@/app/components/ProjectGallery'
import type { ProjectWithProfile } from '@/app/lib/types'

export default async function HomePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: projects } = await supabase
    .from('projects')
    .select('*, profiles(display_name, avatar_url)')
    .eq('status', 'published')
    .order('created_at', { ascending: false })

  const items = (projects ?? []) as ProjectWithProfile[]

  return (
    <>
      <section className="bg-brand-navy px-4 py-16 text-center md:py-24">
        <h1 className="text-4xl font-bold text-white md:text-5xl">TechEdu Insight</h1>
        <p className="mt-4 text-lg text-brand-sky md:text-xl">AI 프로젝트 공유 및 학습 플랫폼</p>
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
          <Link
            href="#showcase"
            className="inline-flex min-w-[200px] items-center justify-center rounded-lg bg-white px-6 py-3 text-sm font-semibold text-brand-navy shadow-sm transition-colors hover:bg-brand-bg"
          >
            프로젝트 둘러보기
          </Link>
          <Link
            href="/lectures"
            className="inline-flex min-w-[200px] items-center justify-center rounded-lg border-2 border-brand-sky bg-transparent px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-sky/20"
          >
            강의 보러가기
          </Link>
        </div>
        {user && (
          <Link
            href="/dashboard/projects/new"
            className="mt-8 inline-block text-sm font-medium text-brand-sky underline-offset-4 hover:underline"
          >
            + 내 프로젝트 등록하기
          </Link>
        )}
      </section>

      <main id="showcase" className="mx-auto w-full max-w-6xl scroll-mt-20 px-4 py-10">
        <ProjectGallery projects={items} />
      </main>
    </>
  )
}
