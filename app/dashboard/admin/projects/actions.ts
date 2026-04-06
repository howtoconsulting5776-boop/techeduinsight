'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/app/lib/supabase/server'
import { createServiceRoleClient } from '@/app/lib/supabase/service'

async function requireAdminOrRedirect() {
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

  if (profile?.role !== 'ADMIN') redirect('/dashboard')
}

export async function approveProject(formData: FormData) {
  await requireAdminOrRedirect()
  const id = (formData.get('id') as string)?.trim()
  if (!id) redirect('/dashboard/admin/projects')

  const iframeAllowed = formData.get('iframe_allowed') === 'on'

  const svc = createServiceRoleClient()
  const { error } = await svc
    .from('projects')
    .update({ status: 'published', iframe_allowed: iframeAllowed })
    .eq('id', id)
    .eq('status', 'draft')

  if (error) redirect(`/dashboard/admin/projects?err=${encodeURIComponent(error.message)}`)

  revalidatePath('/dashboard/admin/projects')
  revalidatePath('/admin/projects')
  revalidatePath('/dashboard/projects')
  revalidatePath('/')
  revalidatePath('/')
  revalidatePath(`/projects/${id}`)
}

export async function updatePublishedIframe(formData: FormData) {
  await requireAdminOrRedirect()
  const id = (formData.get('id') as string)?.trim()
  if (!id) redirect('/dashboard/admin/projects')

  const iframeAllowed = formData.get('iframe_allowed') === 'on'

  const svc = createServiceRoleClient()
  const { error } = await svc
    .from('projects')
    .update({ iframe_allowed: iframeAllowed })
    .eq('id', id)
    .eq('status', 'published')

  if (error) redirect(`/dashboard/admin/projects?err=${encodeURIComponent(error.message)}`)

  revalidatePath('/dashboard/admin/projects')
  revalidatePath('/admin/projects')
  revalidatePath(`/projects/${id}`)
}
