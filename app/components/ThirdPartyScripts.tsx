'use client'

import Script from 'next/script'

/**
 * 선택적 서드파티 스크립트. `NEXT_PUBLIC_GA_MEASUREMENT_ID`가 있을 때만 gtag를 로드합니다.
 */
export function ThirdPartyScripts() {
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim()
  if (!gaId) return null

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config',${JSON.stringify(gaId)});`}
      </Script>
    </>
  )
}
