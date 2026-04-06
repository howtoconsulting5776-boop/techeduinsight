import Link from 'next/link'

export default function InsightNotFound() {
  return (
    <main className="mx-auto flex min-h-[40vh] w-full max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
      <h1 className="text-xl font-semibold">인사이트를 찾을 수 없습니다</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        삭제되었거나 아직 공개되지 않았을 수 있습니다.
      </p>
      <Link
        href="/insights"
        className="mt-6 text-sm font-medium text-brand-navy underline-offset-4 hover:underline"
      >
        인사이트 목록으로
      </Link>
    </main>
  )
}
