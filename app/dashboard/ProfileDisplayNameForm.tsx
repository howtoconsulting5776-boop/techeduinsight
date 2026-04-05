'use client'

import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  updateDisplayName,
  type ProfileDisplayNameState,
} from '@/app/dashboard/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function ProfileDisplayNameForm({
  initialDisplayName,
}: {
  initialDisplayName: string
}) {
  const router = useRouter()
  const [state, formAction, pending] = useActionState<
    ProfileDisplayNameState,
    FormData
  >(updateDisplayName, null)

  useEffect(() => {
    if (state?.success) {
      router.refresh()
    }
  }, [state?.success, router])

  return (
    <form action={formAction} className="space-y-3 rounded-lg border border-border p-4">
      <div>
        <Label htmlFor="dashboard-display-name">공개 별명</Label>
        <p className="mt-1 text-xs text-muted-foreground">
          쇼케이스·프로젝트 카드에 &quot;by …&quot; 로 표시됩니다.
        </p>
      </div>
      <Input
        id="dashboard-display-name"
        name="displayName"
        key={initialDisplayName}
        defaultValue={initialDisplayName}
        required
        minLength={2}
        maxLength={40}
        autoComplete="nickname"
      />
      {state?.error ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}
      {state?.success ? (
        <p className="text-sm text-emerald-700 dark:text-emerald-400">저장했습니다.</p>
      ) : null}
      <Button type="submit" disabled={pending} variant="secondary" className="w-full sm:w-auto">
        {pending ? '저장 중…' : '별명 저장'}
      </Button>
    </form>
  )
}
