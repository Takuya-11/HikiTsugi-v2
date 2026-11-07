export const instant = false

import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ShareManager from '@/components/share/ShareManager'

export default async function SharePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: doc } = await supabase
    .from('documents')
    .select('id, title')
    .eq('id', id)
    .single()

  if (!doc) redirect('/dashboard')

  const { data: tokenRow } = await supabase
    .from('share_tokens')
    .select('status')
    .eq('document_id', id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const status = (tokenRow?.status ?? 'none') as 'none' | 'active' | 'revoked'

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6">
        <Link
          href={`/documents/${id}/edit`}
          className="text-sm text-muted-foreground hover:underline"
        >
          ← 編集に戻る
        </Link>
        <h1 className="mt-2 text-xl font-semibold text-foreground">共有管理</h1>
        <p className="mt-1 text-sm text-muted-foreground">{doc.title || '無題の引き継ぎ書'}</p>
      </div>

      <ShareManager documentId={id} initialStatus={status} />
    </div>
  )
}
