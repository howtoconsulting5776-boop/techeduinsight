import type { Metadata } from 'next'
import { buildPrivatePageMetadata } from '@/app/lib/seo'

export const metadata: Metadata = buildPrivatePageMetadata({
  title: '로그인',
  description: 'TechEdu Insight 계정으로 로그인합니다. 개인 계정 페이지는 검색 색인에서 제외됩니다.',
})

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children
}
