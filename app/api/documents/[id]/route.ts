import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { title, data, version } = await request.json()

  const { data: updated, error } = await supabase
    .from('documents')
    .update({ title, data, version: version + 1 })
    .eq('id', id)
    .eq('version', version)
    .select('id, version')
    .single()

  if (error?.code === 'PGRST116') {
    const { data: existing } = await supabase
      .from('documents')
      .select('version')
      .eq('id', id)
      .single()

    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ error: 'Conflict', serverVersion: existing.version }, { status: 409 })
  }
  if (error) return NextResponse.json({ error: 'Internal error' }, { status: 500 })

  return NextResponse.json({ version: updated.version })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const { count, error } = await supabase
    .from('documents')
    .delete({ count: 'exact' })
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: 'ドキュメントの削除に失敗しました' }, { status: 500 })
  }

  if (count === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}
