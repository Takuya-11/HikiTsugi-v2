import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const INITIAL_DATA = {
  basicInfo: {
    title: '', overview: '', fromPerson: '', toPerson: '',
    category: '', frequency: '', createdAt: '',
  },
  systemInfo: {
    systemName: '', environment: '', targetDevices: '',
    osVersion: '', tools: '', connectionInfo: '', documentUrl: '',
  },
  procedures: [],
  incidents: [],
  precautions: { notes: '', prohibitions: '', supplementaryNotes: '' },
  references: [],
}

export async function POST() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('documents')
    .insert({ user_id: user.id, title: '無題の引き継ぎ書', data: INITIAL_DATA, version: 1 })
    .select('id')
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'ドキュメントの作成に失敗しました' }, { status: 500 })
  }

  return NextResponse.json({ id: data.id }, { status: 201 })
}
