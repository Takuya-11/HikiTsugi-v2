import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateShareToken } from '@/lib/token'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const { plainToken, tokenHash } = generateShareToken()

  await supabase
    .from('share_tokens')
    .update({ status: 'revoked', revoked_at: new Date().toISOString() })
    .eq('document_id', id)
    .eq('status', 'active')

  const { error } = await supabase
    .from('share_tokens')
    .insert({ document_id: id, token_hash: tokenHash, status: 'active' })

  if (error) return NextResponse.json({ error: 'トークンの発行に失敗しました' }, { status: 500 })

  return NextResponse.json({ token: plainToken }, { status: 201 })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const { error } = await supabase
    .from('share_tokens')
    .update({ status: 'revoked', revoked_at: new Date().toISOString() })
    .eq('document_id', id)
    .eq('status', 'active')

  if (error) return NextResponse.json({ error: '停止に失敗しました' }, { status: 500 })

  return NextResponse.json({ success: true })
}
