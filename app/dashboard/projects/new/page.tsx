'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ThumbnailCropField } from '@/app/components/ThumbnailCropField'
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
import Link from 'next/link'

export default function NewProjectPage() {
  const router = useRouter()
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  return (
    <main className="flex min-h-screen items-start justify-center bg-background px-4 py-12">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">새 프로젝트 등록</CardTitle>
          <CardDescription>작업물을 쇼케이스에 등록합니다</CardDescription>
        </CardHeader>

        <form
          onSubmit={async (e) => {
            e.preventDefault()
            setError(null)
            setPending(true)
            try {
              const form = e.currentTarget
              const fd = new FormData(form)
              if (thumbnailFile) {
                fd.set('thumbnail', thumbnailFile)
              }
              const res = await fetch('/api/projects', {
                method: 'POST',
                body: fd,
              })
              const data = (await res.json()) as {
                ok: boolean
                error?: string
              }
              if (!res.ok || !data.ok) {
                setError(data.error ?? '등록에 실패했습니다.')
                return
              }
              router.push('/dashboard/projects')
              router.refresh()
            } catch {
              setError('네트워크 오류로 등록할 수 없습니다.')
            } finally {
              setPending(false)
            }
          }}
        >
          <CardContent className="space-y-5">
            {error && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            {/* Title */}
            <div className="space-y-1.5">
              <Label htmlFor="title">
                제목 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                name="title"
                placeholder="프로젝트 제목을 입력하세요"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="description">설명</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="프로젝트에 대한 설명을 입력하세요"
                rows={4}
              />
            </div>

            {/* Deploy URL */}
            <div className="space-y-1.5">
              <Label htmlFor="deploy_url">배포 URL</Label>
              <Input
                id="deploy_url"
                name="deploy_url"
                type="url"
                placeholder="https://your-project.vercel.app"
              />
            </div>

            <p className="rounded-lg border border-border bg-muted/30 px-3 py-3 text-xs text-muted-foreground leading-relaxed">
              공개 여부와 iframe 미리보기 허용은 관리자 심사 후 설정됩니다. 제출 후 &quot;검토중&quot;
              상태로 저장됩니다.
            </p>

            {/* Tags */}
            <div className="space-y-1.5">
              <Label htmlFor="tags">태그</Label>
              <Input
                id="tags"
                name="tags"
                placeholder="React, TypeScript, Tailwind (쉼표로 구분)"
              />
              <p className="text-xs text-muted-foreground">
                쉼표(,)로 구분해 여러 태그를 입력할 수 있습니다
              </p>
            </div>

            <ThumbnailCropField onPreparedFileChange={setThumbnailFile} />
          </CardContent>

          <CardFooter className="flex gap-3">
            <Button type="submit" disabled={pending} className="flex-1">
              {pending ? '등록 중…' : '초안으로 저장'}
            </Button>
            <Link
              href="/dashboard/projects"
              className="inline-flex items-center justify-center rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
            >
              취소
            </Link>
          </CardFooter>
        </form>
      </Card>
    </main>
  )
}
