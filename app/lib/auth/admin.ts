import { redirect } from 'next/navigation'
import { createClient } from '@/app/lib/supabase/server'

export interface AdminSession {
  userId: string
  email: string | undefined
}

/**
 * Ensures the current user is logged in and has role ADMIN.
 * Otherwise redirects to /dashboard (or /login if not authenticated).
 */
export async function requireAdmin(): Promise<AdminSession> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirectTo=/admin/users')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  return { userId: user.id, email: user.email }
}
