import { adminListUsers } from '@/app/admin/actions'
import AdminUsersTable from './users-table'

export default async function AdminUsersPage() {
  const res = await adminListUsers()
  if (!res.ok) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
        사용자 목록을 불러오지 못했습니다: {res.error}
      </div>
    )
  }

  return <AdminUsersTable initialUsers={res.users} />
}
