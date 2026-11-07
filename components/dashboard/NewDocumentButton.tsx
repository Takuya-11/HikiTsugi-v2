'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export default function NewDocumentButton({ label = '＋ 新規作成' }: { label?: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCreate = async () => {
    if (loading) return
    setLoading(true)
    setError(null)

    const res = await fetch('/api/documents', { method: 'POST' })

    if (!res.ok) {
      setError('作成に失敗しました。再試行してください。')
      setLoading(false)
      return
    }

    const { id } = await res.json()
    router.push(`/documents/${id}/edit`)
  }

  return (
    <div>
      <Button onClick={handleCreate} disabled={loading}>
        {loading ? '作成中...' : label}
      </Button>
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  )
}
