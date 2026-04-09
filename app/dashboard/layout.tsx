import type { Metadata } from 'next'
import { buildPrivatePageMetadata } from '@/app/lib/seo'

export const metadata: Metadata = buildPrivatePageMetadata({
  title: '대시보드',
  description: 'TechEdu Insight 학습자 대시보드. 개인화 영역으로 검색 엔진 색인에서 제외됩니다.',
})

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
