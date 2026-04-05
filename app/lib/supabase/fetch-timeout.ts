/**
 * Undici 기본 연결 타임아웃(약 10s) 동안 요청이 멈추면 Next proxy·레이아웃이 오래 블로킹된다.
 * 짧은 상한으로 빨리 실패하게 하고, 호출부에서 graceful 하게 처리한다.
 */
export function fetchWithTimeout(timeoutMs: number): typeof fetch {
  return async (input, init) => {
    const controller = new AbortController()
    const id = setTimeout(() => controller.abort(), timeoutMs)
    try {
      return await fetch(input, {
        ...init,
        signal: controller.signal,
      })
    } finally {
      clearTimeout(id)
    }
  }
}

/** 서버 RSC·서버 액션용 (테이블 조회 등) */
export const SERVER_FETCH_TIMEOUT_MS = 15_000

/** proxy(미들웨어) — 매 요청마다 실행되므로 상대적으로 짧게 */
export const PROXY_FETCH_TIMEOUT_MS = 8_000

/** 브라우저 Supabase 클라이언트 */
export const BROWSER_FETCH_TIMEOUT_MS = 15_000
