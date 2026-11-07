export const instant = false

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DocumentEditor from '@/components/editor/DocumentEditor'

export default async function EditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: doc, error } = await supabase
    .from('documents')
    .select('id, title, data, version')
    .eq('id', id)
    .single()

  if (error || !doc) redirect('/dashboard')

  return <DocumentEditor initialDoc={doc} />
}
