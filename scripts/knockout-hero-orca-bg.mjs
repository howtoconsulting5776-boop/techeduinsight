/**
 * hero-orca.png: 가장자리에서 연결된 흰 배경만 알파 0 (흰 복부는 검은 윤곽으로 막혀 있으면 유지)
 */
import sharp from 'sharp'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const inputPath = path.join(root, 'public', 'hero-orca.png')

function isBg(r, g, b) {
  return r >= 245 && g >= 245 && b >= 245
}

const { data, info } = await sharp(inputPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
const w = info.width
const h = info.height
const ch = info.channels
const out = Buffer.from(data)

const visited = new Uint8Array(w * h)
const q = []

function idx(x, y) {
  return (y * w + x) * ch
}

function vi(x, y) {
  return y * w + x
}

function tryEdge(x, y) {
  if (x < 0 || x >= w || y < 0 || y >= h) return
  const v = vi(x, y)
  if (visited[v]) return
  const i = idx(x, y)
  const r = data[i]
  const g = data[i + 1]
  const b = data[i + 2]
  if (!isBg(r, g, b)) return
  visited[v] = 1
  q.push([x, y])
}

for (let x = 0; x < w; x++) {
  tryEdge(x, 0)
  tryEdge(x, h - 1)
}
for (let y = 0; y < h; y++) {
  tryEdge(0, y)
  tryEdge(w - 1, y)
}

while (q.length) {
  const [x, y] = q.pop()
  const i = idx(x, y)
  out[i + 3] = 0
  for (const [dx, dy] of [
    [0, 1],
    [0, -1],
    [1, 0],
    [-1, 0],
  ]) {
    const nx = x + dx
    const ny = y + dy
    if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue
    const v = vi(nx, ny)
    if (visited[v]) continue
    const j = idx(nx, ny)
    const r = data[j]
    const g = data[j + 1]
    const b = data[j + 2]
    if (isBg(r, g, b)) {
      visited[v] = 1
      q.push([nx, ny])
    }
  }
}

const tmpPath = path.join(root, 'public', 'hero-orca.tmp.png')
await sharp(out, { raw: { width: w, height: h, channels: 4 } })
  .png()
  .toFile(tmpPath)

const fs = await import('fs/promises')
await fs.unlink(inputPath).catch(() => {})
await fs.rename(tmpPath, inputPath)

console.log('knockout-hero-orca-bg: wrote', inputPath, `${w}x${h}`)
