'use client'

import { useState, useTransition } from 'react'
import {
  adminUpdateUserRole,
  type AdminEditableUserRole,
  type AdminUserRow,
} from '@/app/admin/actions'

const ROLE_OPTIONS: AdminEditableUserRole[] = [
  'GUEST',
  'MEMBER',
  'PREMIUM',
  'TEACHER',
  'ADMIN',
]

interface Props {
  initialUsers: AdminUserRow[]
}

export default function AdminUsersTable({ initialUsers }: Props) {
  const [users, setUsers] = useState(initialUsers)
  const [message, setMessage] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function onRoleChange(userId: string, role: AdminEditableUserRole) {
    setMessage(null)
    startTransition(async () => {
      const res = await adminUpdateUserRole(userId, role)
      if (!res.ok) {
        setMessage(res.error)
        return
      }
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role } : u)),
      )
    })
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">사용자 관리</h1>
      <p className="text-sm text-muted-foreground">
        역할 변경은 서비스 권한으로 즉시 반영됩니다.
      </p>
      {message ? (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {message}
        </p>
      ) : null}
      {pending ? (
        <p className="text-sm text-muted-foreground">처리 중…</p>
      ) : null}

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-border bg-muted/50">
            <tr>
              <th className="px-4 py-3 font-semibold">이메일</th>
              <th className="px-4 py-3 font-semibold">이름</th>
              <th className="px-4 py-3 font-semibold">역할</th>
              <th className="px-4 py-3 font-semibold">가입일</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-mono text-xs">{u.email}</td>
                <td className="px-4 py-3">{u.display_name ?? '—'}</td>
                <td className="px-4 py-3">
                  <select
                    value={
                      ROLE_OPTIONS.includes(u.role as AdminEditableUserRole)
                        ? u.role
                        : 'MEMBER'
                    }
                    onChange={(e) =>
                      onRoleChange(u.id, e.target.value as AdminEditableUserRole)
                    }
                    disabled={pending}
                    className="rounded-md border border-input bg-background px-2 py-1.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {ROLE_OPTIONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {new Date(u.created_at).toLocaleDateString('ko-KR')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
