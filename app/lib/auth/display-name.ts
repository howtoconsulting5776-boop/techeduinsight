/** 회원가입 시 공개 표시 이름(쇼케이스 by … 등) */

const MIN = 2
const MAX = 40

export function validateSignupDisplayName(raw: string): { ok: true; value: string } | { ok: false; error: string } {
  const t = raw.trim()
  if (!t) {
    return { ok: false, error: '별명을 입력하세요.' }
  }
  if (t.length < MIN) {
    return { ok: false, error: `별명은 ${MIN}자 이상 입력하세요.` }
  }
  if (t.length > MAX) {
    return { ok: false, error: `별명은 ${MAX}자 이하여야 합니다.` }
  }
  return { ok: true, value: t }
}
