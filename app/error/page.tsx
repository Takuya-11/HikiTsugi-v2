export const instant = false

import Link from 'next/link'

const MESSAGES: Record<string, { title: string; description: string }> = {
  revoked: {
    title: '共有が停止されました',
    description: 'このURLの共有は停止されています。作成者に確認してください。',
  },
  invalid: {
    title: 'このURLは有効ではありません',
    description: '共有URLが見つかりません。URLが正しいか確認してください。',
  },
}

export default async function ErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>
}) {
  const { reason } = await searchParams
  const message = MESSAGES[reason ?? ''] ?? {
    title: 'アクセスできません',
    description: 'この共有URLは無効または停止されています。',
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <div className="max-w-md space-y-4">
        <h1 className="text-2xl font-bold text-foreground">{message.title}</h1>
        <p className="text-sm text-muted-foreground">{message.description}</p>
        <Link href="/" className="inline-block text-sm text-primary underline">
          トップページへ
        </Link>
      </div>
    </div>
  )
}
