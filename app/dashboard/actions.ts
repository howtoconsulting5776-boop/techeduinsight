'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { validateSignupDisplayName } from '@/app/lib/auth/display-name'
import { createClient } from '@/app/lib/supabase/server'

export type ProfileDisplayNameState = { error?: string; success?: boolean } | null

export async function updateDisplayName(
  _prev: ProfileDisplayNameState,
  formData: FormData,
): Promise<ProfileDisplayNameState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const raw = (formData.get('displayName') as string) ?? ''
  const v = validateSignupDisplayName(raw)
  if (!v.ok) {
    return { error: v.error }
  }

  const { error } = await supabase
    .from('profiles')
    .update({ display_name: v.value })
    .eq('id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  revalidatePath('/dashboard')

  return { success: true }
}
