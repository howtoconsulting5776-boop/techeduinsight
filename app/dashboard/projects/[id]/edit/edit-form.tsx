'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { deleteProject, updateProject } from './actions'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import type { Project } from '@/app/lib/types'

type ActionState = { error?: string } | null

interface Props {
  project: Project
  viewerIsAdmin: boolean
  cancelHref: string
}

export default function EditProjectForm({ project, viewerIsAdmin, cancelHref }: Props) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    updateProject,
    null,
  )

  const tagsStr = project.tags?.join(', ') ?? ''

  return (
    <main className="flex min-h-screen items-start justify-center bg-background px-4 py-12">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">프로젝트 수정</CardTitle>
          <CardDescription>
            {viewerIsAdmin
              ? '관리자로 모든 필드를 수정할 수 있습니다. 삭제 시 복구할 수 없습니다.'
              : project.status === 'published'
                ? '공개된 프로젝트입니다. 제목·설명·배포 URL·태그·썸네일을 수정할 수 있으며, 공개 상태는 관리자만 바꿀 수 있습니다.'
                : '검토 중인 초안입니다. 공개되면 쇼케이스에 노출됩니다.'}
          </CardDescription>
        </CardHeader>

        <form action={formAction}>
          <input type="hidden" name="id" value={project.id} />
          <input type="hidden" name="thumbnail_path_current" value={project.thumbnail_path ?? ''} />

          <CardContent className="space-y-5">
            {state?.error && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {state.error}
              </p>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="title">
                제목 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                name="title"
                defaultValue={project.title}
                placeholder="프로젝트 제목을 입력하세요"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">설명</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={project.description ?? ''}
                placeholder="프로젝트에 대한 설명을 입력하세요"
                rows={4}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="deploy_url">배포 URL</Label>
              <Input
                id="deploy_url"
                name="deploy_url"
                type="url"
                defaultValue={project.deploy_url ?? ''}
                placeholder="https://your-project.vercel.app"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tags">태그</Label>
              <Input
                id="tags"
                name="tags"
                defaultValue={tagsStr}
                placeholder="React, TypeScript, Tailwind (쉼표로 구분)"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="thumbnail">썸네일 이미지 (바꾸려면 선택)</Label>
              <Input
                id="thumbnail"
                name="thumbnail"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-wrap gap-3">
            <Button type="submit" disabled={pending} className="flex-1 sm:flex-none">
              {pending ? '저장 중…' : '저장'}
            </Button>
            <Link
              href={cancelHref}
              className="inline-flex items-center justify-center rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
            >
              취소
            </Link>
          </CardFooter>
        </form>

        <form
          action={deleteProject}
          className="border-t px-6 py-4"
          onSubmit={(e) => {
            const msg =
              project.status === 'published'
                ? '공개 중인 프로젝트를 삭제할까요? 갤러리에서도 사라지며 되돌릴 수 없습니다.'
                : '이 초안을 삭제할까요? 이 작업은 되돌릴 수 없습니다.'
            if (!confirm(msg)) {
              e.preventDefault()
            }
          }}
        >
          <input type="hidden" name="id" value={project.id} />
          <Button type="submit" variant="destructive" size="sm">
            {project.status === 'published' ? '프로젝트 삭제' : '초안 삭제'}
          </Button>
        </form>
      </Card>
    </main>
  )
}
