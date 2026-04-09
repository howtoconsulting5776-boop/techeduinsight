/**
 * public/og-image.png 기준으로 PWA·Apple 터치 아이콘 생성 (sharp 필요).
 * 실행: node ./scripts/generate-pwa-icons.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const src = path.join(root, 'public', 'og-image.png')
const outDir = path.join(root, 'public', 'icons')

const navy = { r: 27, g: 58, b: 107, alpha: 1 }

async function main() {
  if (!fs.existsSync(src)) {
    console.error('Missing public/og-image.png — add OG image first.')
    process.exit(1)
  }
  fs.mkdirSync(outDir, { recursive: true })

  const base = sharp(src)

  await base
    .clone()
    .resize(192, 192, { fit: 'cover', position: 'centre' })
    .png({ compressionLevel: 9 })
    .toFile(path.join(outDir, 'icon-192.png'))

  await base
    .clone()
    .resize(512, 512, { fit: 'cover', position: 'centre' })
    .png({ compressionLevel: 9 })
    .toFile(path.join(outDir, 'icon-512.png'))

  const mSize = 512
  const inner = Math.round(mSize * 0.55)
  const innerBuf = await sharp(src)
    .resize(inner, inner, { fit: 'cover', position: 'centre' })
    .png()
    .toBuffer()

  await sharp({
    create: {
      width: mSize,
      height: mSize,
      channels: 4,
      background: navy,
    },
  })
    .composite([{ input: innerBuf, gravity: 'centre' }])
    .png({ compressionLevel: 9 })
    .toFile(path.join(outDir, 'maskable-512.png'))

  await base
    .clone()
    .resize(180, 180, { fit: 'cover', position: 'centre' })
    .png({ compressionLevel: 9 })
    .toFile(path.join(outDir, 'apple-touch-icon.png'))

  console.log('Wrote public/icons/*.png')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
