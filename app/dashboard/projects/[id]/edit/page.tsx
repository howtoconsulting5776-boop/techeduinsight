import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/app/lib/supabase/server'
import EditProjectForm from './edit-form'
import type { Project } from '@/app/lib/types'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditProjectPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  const viewerIsAdmin = profile?.role === 'ADMIN'

  const { data: row, error } = await supabase.from('projects').select('*').eq('id', id).single()

  if (error || !row) notFound()

  const project = row as Project
  if (project.owner_id !== user.id && !viewerIsAdmin) redirect('/dashboard/projects')

  return (
    <EditProjectForm
      project={project}
      viewerIsAdmin={viewerIsAdmin}
      cancelHref={viewerIsAdmin ? '/admin/projects' : '/dashboard/projects'}
    />
  )
}
