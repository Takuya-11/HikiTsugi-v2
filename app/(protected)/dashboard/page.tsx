export const instant = false

import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import NewDocumentButton from '@/components/dashboard/NewDocumentButton'
import DeleteButton from '@/components/dashboard/DeleteButton'

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('ja-JP', {
    year: 'numeric', month: 'numeric', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: documents, error } = await supabase
    .from('documents')
    .select('id, title, updated_at')
    .order('updated_at', { ascending: false })

  if (error) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <p className="text-sm text-destructive">
          ドキュメントの読み込みに失敗しました。ページを再読み込みしてください。
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">引き継ぎ書一覧</h1>
        <NewDocumentButton />
      </div>

      {documents.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <p className="text-muted-foreground">まだ引き継ぎ書がありません</p>
          <NewDocumentButton label="＋ 最初の引き継ぎ書を作成" />
        </div>
      ) : (
        <div className="divide-y divide-border rounded-lg border border-border">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between gap-4 px-4 py-3"
            >
              <Link
                href={`/documents/${doc.id}/edit`}
                className="flex-1 truncate text-sm font-medium text-foreground hover:underline"
              >
                {doc.title || '無題'}
              </Link>
              <span className="shrink-0 text-xs text-muted-foreground">
                {formatDate(doc.updated_at)}
              </span>
              <DeleteButton id={doc.id} title={doc.title || '無題'} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
