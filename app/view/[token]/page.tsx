export const instant = false

export const metadata = {
  robots: { index: false, follow: false },
}

import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { hashToken } from '@/lib/token'
import PreviewDocument from '@/components/preview/PreviewDocument'
import PrintButton from '@/components/preview/PrintButton'

export default async function ViewPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const admin = createAdminClient()

  const tokenHash = hashToken(token)

  const { data: tokenRow } = await admin
    .from('share_tokens')
    .select('document_id, status')
    .eq('token_hash', tokenHash)
    .single()

  if (!tokenRow) redirect('/error?reason=invalid')
  if (tokenRow.status !== 'active') redirect('/error?reason=revoked')

  const { data: doc } = await admin
    .from('documents')
    .select('title, data')
    .eq('id', tokenRow.document_id)
    .single()

  if (!doc) redirect('/error?reason=invalid')

  return (
    <div>
      <div className="print:hidden sticky top-0 z-10 border-b border-border bg-background px-4 py-2 flex items-center justify-between">
        <span className="text-sm text-muted-foreground">閲覧専用</span>
        <PrintButton />
      </div>
      <PreviewDocument title={doc.title} data={doc.data} />
      <footer className="print:hidden mx-auto max-w-[210mm] px-8 py-6 text-center text-xs text-muted-foreground">
        <p>
          この引き継ぎ書は{' '}
          <Link href="/" className="underline">
            HikiTsugi v2
          </Link>{' '}
          で作成されました。
        </p>
      </footer>
    </div>
  )
}
