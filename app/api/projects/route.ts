import { NextResponse } from 'next/server'
import { createClient } from '@/app/lib/supabase/server'
import { createProjectFromForm } from '@/app/lib/projects/create-project-from-form'

export const runtime = 'nodejs'

/**
 * 새 프로젝트 초안 등록. Server Action + Flight 대신 multipart를 그대로 처리해
 * RSC 디코딩/큐 관련 오류를 피합니다.
 */
export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      { ok: false as const, error: '로그인이 필요합니다.' },
      { status: 401 },
    )
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json(
      { ok: false as const, error: '요청 본문을 읽을 수 없습니다.' },
      { status: 400 },
    )
  }

  const result = await createProjectFromForm(supabase, user.id, formData)
  if (!result.ok) {
    return NextResponse.json(result, { status: 400 })
  }

  return NextResponse.json({ ok: true as const })
}
