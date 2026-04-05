'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { addProjectComment } from '@/app/projects/social-actions'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

export function ProjectCommentForm({
  projectId,
  parentId = null,
  placeholder = '댓글을 입력하세요…',
  submitLabel = '댓글 달기',
  compact = false,
}: {
  projectId: string
  parentId?: string | null
  placeholder?: string
  submitLabel?: string
  compact?: boolean
}) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    const body = String(fd.get('body') ?? '')
    startTransition(async () => {
      try {
        const res = await addProjectComment(projectId, body, parentId)
        if (res.ok) {
          formRef.current?.reset()
          router.refresh()
        } else {
          setError(res.error)
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : '댓글 등록에 실패했습니다.')
      }
    })
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="space-y-2">
      <Textarea
        name="body"
        placeholder={placeholder}
        rows={compact ? 2 : 3}
        maxLength={2000}
        required
        className="resize-y text-sm"
      />
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? '등록 중…' : submitLabel}
      </Button>
    </form>
  )
}
