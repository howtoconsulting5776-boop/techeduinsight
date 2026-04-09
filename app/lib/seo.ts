import type { Metadata } from 'next'
import { getMetadataBase } from '@/app/lib/site-metadata'

export const SEO_BRAND = 'TechEdu Insight'

/** 검색·SNS 공통 키워드 (요청: Edutech, 바이브/바이트코딩, 학원, 입시, 진로, AI) */
export const SEO_KEYWORDS_BASE = [
  'Edutech',
  '에듀테크',
  '바이브코딩',
  '바이트코딩',
  '학원',
  '입시',
  '진로',
  'AI',
  SEO_BRAND,
] as const

export function seoAbsoluteUrl(path: string): string {
  const base = getMetadataBase().origin
  const p = path.startsWith('/') ? path : `/${path}`
  return `${base}${p}`
}

function normalizeOgImageUrl(url: string): string {
  const t = url.trim()
  if (/^https?:\/\//i.test(t)) return t
  return new URL(t, getMetadataBase()).toString()
}

/**
 * 공개 페이지용 메타(키워드, canonical, OG/Twitter, 색인 허용).
 */
export function buildPublicPageMetadata(opts: {
  /** 브랜드 템플릿을 쓰려면 짧은 제목만 넣고 `useTitleTemplate: true` */
  title: string
  description: string
  path: string
  extraKeywords?: string[]
  /** OG/Twitter용 절대 또는 site-root 상대 이미지 URL */
  ogImage?: string | null
  ogType?: 'website' | 'article'
  article?: { publishedTime?: string; modifiedTime?: string }
  /** 기본 false — `title | TechEdu Insight` 유지 */
  useTitleTemplate?: boolean
}): Metadata {
  const url = seoAbsoluteUrl(opts.path)
  const keywords = [...SEO_KEYWORDS_BASE, ...(opts.extraKeywords ?? [])]
  const ogImageUrl = opts.ogImage?.trim()
    ? normalizeOgImageUrl(opts.ogImage.trim())
    : undefined

  const titleMeta: Metadata['title'] = opts.useTitleTemplate
    ? opts.title
    : { absolute: opts.title }

  return {
    title: titleMeta,
    description: opts.description,
    keywords: [...new Set(keywords)],
    alternates: { canonical: url },
    openGraph: {
      title: opts.title,
      description: opts.description,
      url,
      siteName: SEO_BRAND,
      locale: 'ko_KR',
      type: opts.ogType ?? 'website',
      ...(ogImageUrl
        ? {
            images: [
              {
                url: ogImageUrl,
                width: 1200,
                height: 630,
                alt: opts.title,
              },
            ],
          }
        : {}),
      ...(opts.article?.publishedTime
        ? { publishedTime: opts.article.publishedTime }
        : {}),
      ...(opts.article?.modifiedTime ? { modifiedTime: opts.article.modifiedTime } : {}),
    },
    twitter: {
      card: ogImageUrl ? 'summary_large_image' : 'summary_large_image',
      title: opts.title,
      description: opts.description,
      ...(ogImageUrl ? { images: [ogImageUrl] } : {}),
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true },
    },
  }
}

/** 로그인·시청·대시보드 등 개인화·민감 구역 */
export function buildPrivatePageMetadata(opts: {
  title: string
  description: string
}): Metadata {
  return {
    title: opts.title,
    description: opts.description,
    robots: {
      index: false,
      follow: false,
      googleBot: { index: false, follow: false, noimageindex: true },
    },
  }
}
