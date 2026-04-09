import type { Metadata } from 'next'
import { buildPrivatePageMetadata } from '@/app/lib/seo'

export const metadata: Metadata = buildPrivatePageMetadata({
  title: '회원가입',
  description: 'TechEdu Insight 신규 계정을 만듭니다. 가입 화면은 검색 색인에서 제외됩니다.',
})

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children
}
