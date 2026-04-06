'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import type { ProjectGalleryItem } from '@/app/lib/types'
import { ProjectCardThumbnail } from '@/app/components/ProjectCardThumbnail'
import { ProjectSocialBar } from '@/app/components/ProjectSocialBar'
import { getThumbnailUrl } from '@/app/lib/storage'
import { Input } from '@/components/ui/input'

function ThumbnailPlaceholder() {
  return (
    <div className="aspect-video w-full bg-[linear-gradient(135deg,var(--brand-navy),var(--brand-sky))]" />
  )
}

interface Props {
  projects: ProjectGalleryItem[]
}

export default function ProjectGallery({ projects }: Props) {
  const [query, setQuery] = useState('')
  const [selectedTags, setSelectedTags] = useState<Set<string>>(() => new Set())

  const allTags = useMemo(() => {
    const set = new Set<string>()
    for (const p of projects) {
      for (const t of p.tags ?? []) {
        if (t.trim()) set.add(t.trim())
      }
    }
    return [...set].sort((a, b) => a.localeCompare(b, 'ko'))
  }, [projects])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return projects.filter((p) => {
      const titleOk = !q || p.title.toLowerCase().includes(q)
      const tagsOk =
        selectedTags.size === 0 ||
        [...selectedTags].every((t) => (p.tags ?? []).includes(t))
      return titleOk && tagsOk
    })
  }, [projects, query, selectedTags])

  function toggleTag(tag: string) {
    setSelectedTags((prev) => {
      const next = new Set(prev)
      if (next.has(tag)) next.delete(tag)
      else next.add(tag)
      return next
    })
  }

  const emptyHint =
    projects.length === 0
      ? '공개된 프로젝트가 없습니다.'
      : '검색·태그 조건에 맞는 프로젝트가 없습니다.'

  return (
    <>
      <div className="mb-6 flex flex-col items-center gap-6">
        <Input
          type="search"
          placeholder="프로젝트 제목으로 검색…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-10 w-full max-w-md rounded-xl border-border/90 px-3.5 shadow-sm"
        />
        {allTags.length > 0 && (
          <div className="w-full max-w-3xl">
            <p className="mb-2 text-center text-xs font-medium text-muted-foreground">
              태그 필터 (다중 선택 · AND)
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {allTags.map((tag) => {
                const on = selectedTags.has(tag)
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                      on
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-muted/50 text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {tag}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="mx-auto max-w-md py-20 text-center">
          <p className="text-muted-foreground">{emptyHint}</p>
          {projects.length === 0 ? (
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              새 프로젝트는 &quot;검토중(초안)&quot;으로 저장되며,{' '}
              <strong className="font-medium text-foreground">관리자가 공개</strong>로 전환한 뒤에만 여기에
              나타납니다. 내 프로젝트는 대시보드에서 확인하세요.
            </p>
          ) : null}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((project) => {
            const thumbUrl = getThumbnailUrl(project.thumbnail_path)
            const dn = project.profiles?.display_name
            const author =
              typeof dn === 'string' && dn.trim() ? dn.trim() : '알 수 없음'
            const detailHref = `/projects/${project.id}`
            const commentsHref = `${detailHref}#comments`

            return (
              <div
                key={project.id}
                className="group overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-navy/15 hover:shadow-lg"
              >
                <Link href={detailHref} prefetch={false} className="block">
                  {thumbUrl ? (
                    <ProjectCardThumbnail src={thumbUrl} alt={project.title} hoverScale />
                  ) : (
                    <ThumbnailPlaceholder />
                  )}
                </Link>

                <ProjectSocialBar
                  projectId={project.id}
                  shareUrl={project.share_url}
                  commentsHref={commentsHref}
                  initialLikesCount={project.likes_count}
                  initialLiked={project.liked_by_me}
                  commentsCount={project.comments_count}
                  compact
                />

                <div className="p-4">
                  <Link href={detailHref} prefetch={false}>
                    <h2 className="line-clamp-1 font-semibold text-card-foreground transition-colors group-hover:text-primary">
                      {project.title}
                    </h2>
                  </Link>
                  <p className="mt-0.5 text-xs text-muted-foreground">by {author}</p>

                  {project.tags && project.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
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
                </div>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
