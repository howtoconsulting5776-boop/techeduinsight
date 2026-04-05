'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/app/lib/supabase/server'

async function requireAdminSupabase() {
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

  return supabase
}

export async function approveProject(formData: FormData) {
  const supabase = await requireAdminSupabase()
  const id = (formData.get('id') as string)?.trim()
  if (!id) redirect('/dashboard/admin/projects')

  const iframeAllowed = formData.get('iframe_allowed') === 'on'

  const { error } = await supabase
    .from('projects')
    .update({ status: 'published', iframe_allowed: iframeAllowed })
    .eq('id', id)
    .eq('status', 'draft')

  if (error) redirect(`/dashboard/admin/projects?err=${encodeURIComponent(error.message)}`)

  revalidatePath('/dashboard/admin/projects')
  revalidatePath('/dashboard/projects')
  revalidatePath('/')
  revalidatePath(`/projects/${id}`)
}

export async function updatePublishedIframe(formData: FormData) {
  const supabase = await requireAdminSupabase()
  const id = (formData.get('id') as string)?.trim()
  if (!id) redirect('/dashboard/admin/projects')

  const iframeAllowed = formData.get('iframe_allowed') === 'on'

  const { error } = await supabase
    .from('projects')
    .update({ iframe_allowed: iframeAllowed })
    .eq('id', id)
    .eq('status', 'published')

  if (error) redirect(`/dashboard/admin/projects?err=${encodeURIComponent(error.message)}`)

  revalidatePath('/dashboard/admin/projects')
  revalidatePath(`/projects/${id}`)
}
