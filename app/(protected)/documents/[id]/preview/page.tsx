export const instant = false

import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PreviewDocument from '@/components/preview/PreviewDocument'
import PrintButton from '@/components/preview/PrintButton'

export default async function PreviewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: doc, error } = await supabase
    .from('documents')
    .select('id, title, data')
    .eq('id', id)
    .single()

  if (error || !doc) redirect('/dashboard')

  return (
    <div>
      <div className="print:hidden sticky top-0 z-10 border-b border-border bg-background px-4 py-2 flex items-center gap-3">
        <Link
          href={`/documents/${id}/edit`}
          className="text-sm text-muted-foreground hover:underline"
        >
          ← 編集に戻る
        </Link>
        <PrintButton />
      </div>
      <PreviewDocument title={doc.title} data={doc.data} />
    </div>
  )
}
