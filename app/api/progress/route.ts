import { NextResponse } from 'next/server'
import { createClient } from '@/app/lib/supabase/server'
import { canWatchLecture } from '@/app/lib/video/access'
import type { UserRole } from '@/app/lib/types'
import type { VideoRole } from '@/app/lib/types'

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  let body: { videoId?: string; progressPct?: number }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const videoId = body.videoId?.trim()
  const progressPct = body.progressPct
  if (!videoId || typeof progressPct !== 'number' || Number.isNaN(progressPct)) {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  }

  const pct = Math.min(100, Math.max(0, Math.round(progressPct)))

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = (profile?.role as UserRole | null) ?? null

  const { data: video, error: vErr } = await supabase
    .from('videos')
    .select('id, required_role')
    .eq('id', videoId)
    .maybeSingle()

  if (vErr || !video) {
    return NextResponse.json({ error: 'forbidden_or_not_found' }, { status: 403 })
  }

  if (!canWatchLecture(video.required_role as VideoRole, role, true)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const completed_at = pct >= 95 ? new Date().toISOString() : null

  const { error: upErr } = await supabase.from('watch_history').upsert(
    {
      user_id: user.id,
      video_id: videoId,
      progress_pct: pct,
      completed_at,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,video_id' },
  )

  if (upErr) {
    return NextResponse.json({ error: upErr.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
