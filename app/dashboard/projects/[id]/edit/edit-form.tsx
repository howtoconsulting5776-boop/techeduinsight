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
}

export default function EditProjectForm({ project }: Props) {
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
            검토 중인 초안만 수정할 수 있습니다. 공개 후 변경은 관리자에게 요청하세요.
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
              href="/dashboard/projects"
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
            if (!confirm('이 초안을 삭제할까요? 이 작업은 되돌릴 수 없습니다.')) {
              e.preventDefault()
            }
          }}
        >
          <input type="hidden" name="id" value={project.id} />
          <Button type="submit" variant="destructive" size="sm">
            초안 삭제
          </Button>
        </form>
      </Card>
    </main>
  )
}
