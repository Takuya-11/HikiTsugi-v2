'use client'

import { Button } from '@/components/ui/button'
import type { Precautions, Reference } from '@/lib/types/handover'

interface Props {
  precautions: Precautions
  references: Reference[]
  onPrecautionsChange: (data: Precautions) => void
  onReferencesChange: (data: Reference[]) => void
  errors?: { references?: Record<string, { url?: string }> }
}

export default function PrecautionsSection({
  precautions,
  references,
  onPrecautionsChange,
  onReferencesChange,
  errors,
}: Props) {
  const updatePrecaution = (field: keyof Precautions, value: string) =>
    onPrecautionsChange({ ...precautions, [field]: value })

  const addReference = () => {
    onReferencesChange([...references, { id: crypto.randomUUID(), name: '', url: '' }])
  }

  const updateReference = (index: number, field: keyof Reference, value: string) => {
    onReferencesChange(references.map((r, i) => (i === index ? { ...r, [field]: value } : r)))
  }

  const removeReference = (index: number) => {
    onReferencesChange(references.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground">注意事項</h3>

        {([
          ['notes', '注意事項'],
          ['prohibitions', '禁止事項'],
          ['supplementaryNotes', '補足事項'],
        ] as [keyof Precautions, string][]).map(([field, label]) => (
          <div key={field}>
            <label htmlFor={field} className="mb-1 block text-sm font-medium text-foreground">{label}</label>
            <textarea
              id={field}
              rows={3}
              value={precautions[field]}
              onChange={(e) => updatePrecaution(field, e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/50"
            />
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">参考資料</h3>

        {references.length === 0 && (
          <p className="text-sm text-muted-foreground">参考資料はまだありません。</p>
        )}

        {references.map((ref, index) => {
          const urlError = errors?.references?.[ref.id]?.url
          return (
            <div key={ref.id} className="flex items-start gap-2">
              <div className="flex-1 space-y-1">
                <input
                  type="text"
                  value={ref.name}
                  onChange={(e) => updateReference(index, 'name', e.target.value)}
                  placeholder="資料名"
                  className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/50"
                />
                <input
                  type="url"
                  value={ref.url}
                  onChange={(e) => updateReference(index, 'url', e.target.value)}
                  placeholder="https://"
                  aria-invalid={!!urlError}
                  className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20"
                />
                {urlError && <p className="text-xs text-destructive">{urlError}</p>}
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => removeReference(index)}
                aria-label="参考資料を削除"
                className="mt-1 text-destructive hover:text-destructive"
              >
                ✕
              </Button>
            </div>
          )
        })}

        <Button variant="outline" size="sm" onClick={addReference}>
          ＋ 参考資料を追加
        </Button>
      </div>
    </div>
  )
}
