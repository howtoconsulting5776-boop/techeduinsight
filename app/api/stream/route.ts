import { NextResponse } from 'next/server'
import { verifyStreamToken } from '@/app/lib/video/token-crypto'
import { getVideoTokenSecret } from '@/app/lib/video/env'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')?.trim()
  if (!token) {
    return NextResponse.json({ error: 'token_required' }, { status: 400 })
  }

  let payload: { videoId: string }
  try {
    const secret = getVideoTokenSecret()
    const p = verifyStreamToken(token, secret)
    payload = { videoId: p.videoId }
  } catch {
    return NextResponse.json({ error: 'invalid_or_expired_token' }, { status: 403 })
  }

  return NextResponse.json(payload)
}
