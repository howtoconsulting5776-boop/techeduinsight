import type { MetadataRoute } from 'next'
import { getMetadataBase } from '@/app/lib/site-metadata'

/**
 * 크롤러: 공개 마케팅·콘텐츠만 허용. API·계정·시청·관리자 경로는 제외(개인정보·권한 보호).
 */
export default function robots(): MetadataRoute.Robots {
  const origin = getMetadataBase().origin

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/dashboard/',
          '/admin/',
          '/watch/',
          '/login',
          '/signup',
          '/auth/',
        ],
      },
    ],
    sitemap: `${origin}/sitemap.xml`,
  }
}
