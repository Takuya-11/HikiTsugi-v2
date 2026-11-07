'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export default function DeleteButton({ id, title }: { id: string; title: string }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async () => {
    if (loading) return
    setLoading(true)
    setError(null)

    const res = await fetch(`/api/documents/${id}`, { method: 'DELETE' })

    if (!res.ok) {
      setError('削除に失敗しました')
      setLoading(false)
      setConfirming(false)
      return
    }

    router.refresh()
  }

  if (confirming) {
    return (
      <span className="inline-flex flex-col items-end gap-1">
        <span className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">「{title}」を削除しますか？</span>
          <Button
            variant="destructive"
            size="sm"
            disabled={loading}
            onClick={handleDelete}
          >
            {loading ? '削除中...' : '削除する'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={loading}
            onClick={() => setConfirming(false)}
          >
            キャンセル
          </Button>
        </span>
        {error && <span className="text-xs text-destructive">{error}</span>}
      </span>
    )
  }

  return (
    <Button variant="ghost" size="sm" onClick={() => setConfirming(true)}>
      削除
    </Button>
  )
}
