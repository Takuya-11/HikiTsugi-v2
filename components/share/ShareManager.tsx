'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

type ShareStatus = 'none' | 'active' | 'revoked'

interface Props {
  documentId: string
  initialStatus: ShareStatus
}

export default function ShareManager({ documentId, initialStatus }: Props) {
  const router = useRouter()
  const [status, setStatus] = useState<ShareStatus>(initialStatus)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const shareUrl = token
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/view/${token}`
    : null

  const handleCreate = async () => {
    if (loading) return
    setLoading(true)
    setError(null)

    const res = await fetch(`/api/documents/${documentId}/share`, { method: 'POST' })

    if (!res.ok) {
      setError('共有URLの発行に失敗しました')
      setLoading(false)
      return
    }

    const { token: newToken } = await res.json()
    setToken(newToken)
    setStatus('active')
    setLoading(false)
    router.refresh()
  }

  const handleRevoke = async () => {
    if (loading) return
    setLoading(true)
    setError(null)

    const res = await fetch(`/api/documents/${documentId}/share`, { method: 'DELETE' })

    if (!res.ok) {
      setError('共有の停止に失敗しました')
      setLoading(false)
      return
    }

    setToken(null)
    setStatus('revoked')
    setLoading(false)
    router.refresh()
  }

  const handleCopy = () => {
    if (!shareUrl) return
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="space-y-4">
      {status === 'none' && (
        <div className="rounded-lg border border-border p-4">
          <p className="mb-3 text-sm text-muted-foreground">
            共有URLを発行すると、URLを知っている人が誰でも閲覧できます。ログインは不要です。
          </p>
          <Button onClick={handleCreate} disabled={loading}>
            {loading ? '発行中...' : '共有URLを発行'}
          </Button>
        </div>
      )}

      {status === 'active' && (
        <div className="rounded-lg border border-border p-4 space-y-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
              共有中
            </span>
          </div>

          {shareUrl ? (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">共有URL（このページを離れると再表示できません）</p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-1 truncate rounded-md border border-border bg-muted px-3 py-1.5 text-sm text-foreground"
                />
                <Button variant="outline" size="sm" onClick={handleCopy}>
                  {copied ? 'コピー済' : 'コピー'}
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              共有中です。URLを再確認するには共有を停止して再発行してください。
            </p>
          )}

          <Button variant="destructive" size="sm" onClick={handleRevoke} disabled={loading}>
            {loading ? '停止中...' : '共有を停止'}
          </Button>
        </div>
      )}

      {status === 'revoked' && (
        <div className="rounded-lg border border-border p-4 space-y-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              停止済み
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            共有を停止しました。旧URLはアクセス不可になりました。
          </p>
          <Button onClick={handleCreate} disabled={loading}>
            {loading ? '発行中...' : '新しい共有URLを発行'}
          </Button>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
