import type { Metadata } from 'next'
import localFont from 'next/font/local'
import { Geist_Mono, Inter } from 'next/font/google'
import Navbar from '@/app/components/Navbar'
import Footer from '@/app/components/Footer'
import { SupabaseBrowserProvider } from '@/app/components/SupabaseBrowserProvider'
import { getSupabaseAnonKey, getSupabaseUrl } from '@/app/lib/supabase/env'
import { getCachedSupabaseAuth } from '@/app/lib/supabase/server'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

/** 한글: Inter에 없는 글리프는 뒤쪽 Pretendard로 렌더링 */
const pretendard = localFont({
  src: '../public/fonts/PretendardVariable.woff2',
  variable: '--font-pretendard',
  display: 'swap',
  weight: '45 920',
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'TechEdu Insight',
  description: 'AI 프로젝트 공유 및 학습 플랫폼',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const { user } = await getCachedSupabaseAuth()

  const supabaseUrl = getSupabaseUrl()
  const supabaseAnonKey = getSupabaseAnonKey()

  return (
    <html
      lang="ko"
      className={`${inter.variable} ${pretendard.variable} ${geistMono.variable} h-full`}
    >
      <body className="flex min-h-full flex-col font-sans">
        <SupabaseBrowserProvider url={supabaseUrl} anonKey={supabaseAnonKey}>
          <Navbar initialUser={user} />
          <div className="flex-1">{children}</div>
          <Footer />
        </SupabaseBrowserProvider>
      </body>
    </html>
  )
}
