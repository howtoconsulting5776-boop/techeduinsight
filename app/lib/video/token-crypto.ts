import crypto from 'crypto'

export interface VideoStreamTokenPayload {
  /** YouTube video ID (not DB uuid) */
  videoId: string
  userId: string
  exp: number
}

/** Issue token; must stay in sync with {@link verifyStreamToken}. */
export function signStreamToken(payload: VideoStreamTokenPayload, secret: string): string {
  const payloadJson = JSON.stringify(payload)
  const payloadB64 = Buffer.from(payloadJson, 'utf8').toString('base64url')
  const sig = crypto
    .createHmac('sha256', secret)
    .update(payloadB64, 'utf8')
    .digest('base64url')
  return `${payloadB64}.${sig}`
}

export function verifyStreamToken(
  token: string,
  secret: string,
): VideoStreamTokenPayload {
  const parts = token.split('.')
  if (parts.length !== 2) {
    throw new Error('invalid_token')
  }
  const [payloadB64, sig] = parts
  const expected = crypto
    .createHmac('sha256', secret)
    .update(payloadB64, 'utf8')
    .digest('base64url')

  if (sig.length !== expected.length || sig !== expected) {
    throw new Error('bad_signature')
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'))
  } catch {
    throw new Error('invalid_payload')
  }

  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    !('videoId' in parsed) ||
    !('userId' in parsed) ||
    !('exp' in parsed)
  ) {
    throw new Error('invalid_payload')
  }

  const o = parsed as Record<string, unknown>
  if (
    typeof o.videoId !== 'string' ||
    typeof o.userId !== 'string' ||
    typeof o.exp !== 'number'
  ) {
    throw new Error('invalid_payload')
  }

  if (Math.floor(Date.now() / 1000) > o.exp) {
    throw new Error('expired')
  }

  return { videoId: o.videoId, userId: o.userId, exp: o.exp }
}
