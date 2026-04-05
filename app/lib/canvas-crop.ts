import type { Area } from 'react-easy-crop'

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('이미지를 불러올 수 없습니다.'))
    img.src = src
  })
}

/**
 * react-easy-crop 의 croppedAreaPixels 기준으로 잘라 WebP Blob 생성 (16:9 영역).
 * 가로는 최대 maxWidth로 다운스케일.
 */
export async function cropToWebPBlob(
  imageSrc: string,
  pixelCrop: Area,
  maxWidth = 1920,
): Promise<Blob> {
  const image = await loadImage(imageSrc)
  const { x, y, width: cw, height: ch } = pixelCrop
  const outW = Math.min(maxWidth, Math.max(1, Math.round(cw)))
  const outH = Math.max(1, Math.round((ch / cw) * outW))

  const canvas = document.createElement('canvas')
  canvas.width = outW
  canvas.height = outH
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Canvas를 사용할 수 없습니다.')
  }

  ctx.drawImage(image, x, y, cw, ch, 0, 0, outW, outH)

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error('이미지 변환에 실패했습니다.'))
      },
      'image/webp',
      0.92,
    )
  })
}
