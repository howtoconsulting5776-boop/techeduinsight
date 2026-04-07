import {
  createHeroOgImageResponse,
  ogContentType,
  ogImageAlt,
  ogImageSize,
} from '@/app/lib/hero-og-image'

export const runtime = 'edge'
export const alt = ogImageAlt
export const size = ogImageSize
export const contentType = ogContentType

export default async function OpenGraphImage() {
  return createHeroOgImageResponse()
}
