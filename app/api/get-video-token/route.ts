import { NextResponse } from 'next/server'
import { createClient } from '@/app/lib/supabase/server'
import { createServiceRoleClient } from '@/app/lib/supabase/service'
import { signStreamToken } from '@/app/lib/video/token-crypto'
import { getVideoTokenSecret } from '@/app/lib/video/env'
import { canWatchLecture } from '@/app/lib/video/access'
import type { UserRole } from '@/app/lib/types'
import type { VideoRole } from '@/app/lib/types'

async function resolveUserId(request: Request): Promise<string | null> {
  const bearer = request.headers.get('authorization')?.trim()
  if (bearer?.toLowerCase().startsWith('bearer ')) {
    const jwt = bearer.slice(7).trim()
    if (jwt) {
      const admin = createServiceRoleClient()
      const {
        data: { user },
        error,
      } = await admin.auth.getUser(jwt)
      if (!error && user) return user.id
    }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user?.id ?? null
}

export async function POST(request: Request) {
  let body: { id?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const videoRecordId = body.id?.trim()
  if (!videoRecordId) {
    return NextResponse.json({ error: 'id_required' }, { status: 400 })
  }

  const userId = await resolveUserId(request)
  if (!userId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  try {
    const admin = createServiceRoleClient()
    const { data: profile, error: pErr } = await admin
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()

    if (pErr || !profile) {
      return NextResponse.json({ error: 'profile_not_found' }, { status: 403 })
    }

    const { data: video, error: vErr } = await admin
      .from('videos')
      .select('youtube_id, required_role')
      .eq('id', videoRecordId)
      .single()

    if (vErr || !video) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 })
    }

    const profileRole = (profile.role as UserRole) ?? 'MEMBER'
    const requiredRole = video.required_role as VideoRole

    if (!canWatchLecture(requiredRole, profileRole, true)) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 })
    }

    const exp = Math.floor(Date.now() / 1000) + 600
    const secret = getVideoTokenSecret()
    const token = signStreamToken(
      {
        videoId: video.youtube_id,
        userId,
        exp,
      },
      secret,
    )

    return NextResponse.json({ token })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}
