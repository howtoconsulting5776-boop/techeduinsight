import { ImageResponse } from 'next/og'

export const ogImageSize = { width: 1200, height: 630 }
export const ogImageAlt = 'TechEdu Insight — AI 프로젝트 공유 및 학습 플랫폼'
export const ogContentType = 'image/png'

const NOTO_KR_WOFF2 =
  'https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-kr@5.0.19/files/noto-sans-kr-korean-700-normal.woff2'

/**
 * 랜딩 히어로와 같은 카피·브랜드 네이비 톤의 OG / 트위터 카드 이미지
 */
export async function createHeroOgImageResponse(): Promise<ImageResponse> {
  let fontData: ArrayBuffer | undefined
  try {
    const res = await fetch(NOTO_KR_WOFF2)
    if (res.ok) fontData = await res.arrayBuffer()
  } catch {
    fontData = undefined
  }

  const fontFamily = fontData ? 'NotoSansKR' : 'system-ui, sans-serif'

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#1B3A6B',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(ellipse 80% 65% at 50% 50%, rgba(74,144,217,0.35), transparent 62%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(ellipse 96% 78% at 0% 100%, rgba(27,58,107,0.85), transparent 55%)',
          }}
        />
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            zIndex: 1,
            padding: '0 56px',
            maxWidth: 1100,
          }}
        >
          <p
            style={{
              fontSize: 22,
              letterSpacing: '0.28em',
              color: 'rgba(255,255,255,0.9)',
              textTransform: 'uppercase',
              margin: 0,
              fontFamily,
              fontWeight: 700,
            }}
          >
            Learning platform
          </p>
          <h1
            style={{
              fontSize: 88,
              fontWeight: 700,
              color: '#ffffff',
              margin: '28px 0 0',
              fontFamily,
              lineHeight: 1.08,
              textAlign: 'center',
            }}
          >
            TechEdu Insight
          </h1>
          <p
            style={{
              fontSize: 36,
              color: 'rgba(255,255,255,0.78)',
              margin: '32px 0 0',
              fontFamily,
              fontWeight: 700,
              textAlign: 'center',
              lineHeight: 1.35,
            }}
          >
            AI 프로젝트 공유 및 학습 플랫폼
          </p>
        </div>
      </div>
    ),
    {
      ...ogImageSize,
      fonts: fontData
        ? [{ name: 'NotoSansKR', data: fontData, style: 'normal', weight: 700 }]
        : [],
    },
  )
}
