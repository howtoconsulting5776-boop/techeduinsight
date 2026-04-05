'use client'

import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import { BROWSER_FETCH_TIMEOUT_MS, fetchWithTimeout } from '@/app/lib/supabase/fetch-timeout'

const SupabaseBrowserContext = createContext<SupabaseClient | null>(null)

/**
 * 서버(레이아웃)에서 읽은 URL·anon 키로 브라우저 클라이언트를 만듭니다.
 * 클라이언트 번들에 NEXT_PUBLIC_* 가 비어 있거나 오래된 값이 박이는 경우를 막습니다.
 */
export function SupabaseBrowserProvider({
  url,
  anonKey,
  children,
}: {
  url: string
  anonKey: string
  children: ReactNode
}) {
  const client = useMemo(() => {
    const browserFetch = fetchWithTimeout(BROWSER_FETCH_TIMEOUT_MS)
    const devLock =
      process.env.NODE_ENV === 'development'
        ? {
            auth: {
              lock: async <R,>(
                _name: string,
                _acquireTimeout: number,
                fn: () => Promise<R>,
              ): Promise<R> => await fn(),
            },
          }
        : {}
    return createBrowserClient(url.trim(), anonKey.trim(), {
      global: { fetch: browserFetch },
      ...devLock,
    })
  }, [url, anonKey])
  return (
    <SupabaseBrowserContext.Provider value={client}>{children}</SupabaseBrowserContext.Provider>
  )
}

export function useSupabaseBrowser(): SupabaseClient {
  const client = useContext(SupabaseBrowserContext)
  if (!client) {
    throw new Error('useSupabaseBrowser는 SupabaseBrowserProvider 안에서만 사용하세요.')
  }
  return client
}
