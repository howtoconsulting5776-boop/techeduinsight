import { createBrowserClient } from '@supabase/ssr'
import { getSupabaseAnonKey, getSupabaseUrl } from '@/app/lib/supabase/env'

/**
 * 클라이언트 컴포넌트에서는 `useSupabaseBrowser()`(SupabaseBrowserProvider)를 쓰는 것을 권장합니다.
 * 레이아웃에서 서버가 읽은 URL·키와 동일하게 맞추기 위함입니다.
 */
export function createClient() {
  return createBrowserClient(getSupabaseUrl(), getSupabaseAnonKey())
}
