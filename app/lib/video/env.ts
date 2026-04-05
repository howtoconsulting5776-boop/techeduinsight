export function getVideoTokenSecret(): string {
  const s = process.env.VIDEO_TOKEN_SECRET?.trim()
  if (!s) {
    throw new Error(
      'Missing VIDEO_TOKEN_SECRET. Set it in .env.local (same value as Edge Function secret).',
    )
  }
  return s
}
