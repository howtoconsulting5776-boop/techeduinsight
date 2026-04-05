'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import type { ProjectCommentRow } from '@/app/lib/types'
import { deleteProjectComment } from '@/app/projects/social-actions'
import { ProjectCommentForm } from '@/app/components/ProjectCommentForm'
import { Button } from '@/components/ui/button'

function groupByParent(rows: ProjectCommentRow[]) {
  const m = new Map<string | null, ProjectCommentRow[]>()
  for (const r of rows) {
    const k = r.parent_id ?? null
    const arr = m.get(k) ?? []
    arr.push(r)
    m.set(k, arr)
  }
  for (const arr of m.values()) {
    arr.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  }
  return m
}

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString('ko-KR', { dateStyle: 'medium', timeStyle: 'short' })
}

function CommentItem({
  comment,
  byParent,
  projectId,
  userLoggedIn,
  currentUserId,
  viewerIsAdmin,
  depth,
}: {
  comment: ProjectCommentRow
  byParent: Map<string | null, ProjectCommentRow[]>
  projectId: string
  userLoggedIn: boolean
  currentUserId: string | null
  viewerIsAdmin: boolean
  depth: number
}) {
  const router = useRouter()
  const [replyOpen, setReplyOpen] = useState(false)
  const [delErr, setDelErr] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const replies = byParent.get(comment.id) ?? []

  const canDelete =
    (currentUserId != null && comment.user_id === currentUserId) || viewerIsAdmin

  function onDelete() {
    if (
      !window.confirm(
        '이 댓글을 삭제할까요? 답글이 달린 댓글이면 답글도 함께 삭제될 수 있습니다.',
      )
    ) {
      return
    }
    setDelErr(null)
    startTransition(async () => {
      const res = await deleteProjectComment(comment.id, projectId)
      if (res.ok) {
        router.refresh()
      } else {
        setDelErr(res.error)
      }
    })
  }

  return (
    <li
      className={`rounded-lg border border-border px-4 py-3 ${
        depth > 0 ? 'bg-muted/25' : 'bg-card/50'
      }`}
    >
      <div className="flex flex-wrap items-baseline gap-2 text-sm">
        <span className="font-semibold text-foreground">{comment.author_display_name}</span>
        <span className="text-xs text-muted-foreground">{formatWhen(comment.created_at)}</span>
      </div>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
        {comment.body}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-1">
        {userLoggedIn ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-xs text-muted-foreground"
            onClick={() => setReplyOpen((v) => !v)}
          >
            {replyOpen ? '닫기' : '답글'}
          </Button>
        ) : null}
        {userLoggedIn && canDelete ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 gap-1 px-2 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
            disabled={pending}
            onClick={onDelete}
            aria-label="댓글 삭제"
          >
            <Trash2 className="size-3.5" strokeWidth={2} />
            삭제
          </Button>
        ) : null}
      </div>
      {delErr ? <p className="mt-1 text-xs text-destructive">{delErr}</p> : null}
      {replyOpen && userLoggedIn ? (
        <div className="mt-3 border-t border-border/60 pt-3">
          <ProjectCommentForm
            projectId={projectId}
            parentId={comment.id}
            compact
            placeholder={`${comment.author_display_name}님에게 답글…`}
            submitLabel="답글 등록"
          />
        </div>
      ) : null}
      {replies.length > 0 ? (
        <ul className="mt-3 space-y-3 border-l-2 border-primary/20 pl-4">
          {replies.map((r) => (
            <CommentItem
              key={r.id}
              comment={r}
              byParent={byParent}
              projectId={projectId}
              userLoggedIn={userLoggedIn}
              currentUserId={currentUserId}
              viewerIsAdmin={viewerIsAdmin}
              depth={depth + 1}
            />
          ))}
        </ul>
      ) : null}
    </li>
  )
}

export function ProjectCommentThread({
  comments,
  projectId,
  userLoggedIn,
  currentUserId,
  viewerIsAdmin,
}: {
  comments: ProjectCommentRow[]
  projectId: string
  userLoggedIn: boolean
  currentUserId: string | null
  viewerIsAdmin: boolean
}) {
  const byParent = groupByParent(comments)
  const roots = byParent.get(null) ?? []

  if (roots.length === 0) {
    return <p className="text-sm text-muted-foreground">아직 댓글이 없습니다.</p>
  }

  return (
    <ul className="space-y-4">
      {roots.map((c) => (
        <CommentItem
          key={c.id}
          comment={c}
          byParent={byParent}
          projectId={projectId}
          userLoggedIn={userLoggedIn}
          currentUserId={currentUserId}
          viewerIsAdmin={viewerIsAdmin}
          depth={0}
        />
      ))}
    </ul>
  )
}
