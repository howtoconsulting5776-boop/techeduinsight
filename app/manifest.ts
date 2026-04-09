import type { MetadataRoute } from 'next'

const BACKGROUND = '#1b3a6b'

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'TechEdu Insight',
    short_name: 'TechEdu',
    description: 'AI 프로젝트 공유 및 학습 플랫폼',
    lang: 'ko',
    dir: 'ltr',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    display_override: ['standalone', 'minimal-ui', 'browser'],
    orientation: 'portrait-primary',
    background_color: BACKGROUND,
    theme_color: BACKGROUND,
    categories: ['education', 'productivity'],
    shortcuts: [
      {
        name: '프로젝트 쇼케이스',
        short_name: '쇼케이스',
        description: '공개 프로젝트 둘러보기',
        url: '/#showcase',
      },
      {
        name: '강의',
        short_name: '강의',
        description: '강의 카탈로그',
        url: '/lectures',
      },
      {
        name: '인사이트',
        short_name: '인사이트',
        description: '에듀 인사이트',
        url: '/insights',
      },
    ],
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
