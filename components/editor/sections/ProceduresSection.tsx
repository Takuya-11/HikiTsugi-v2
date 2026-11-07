'use client'

import { Button } from '@/components/ui/button'
import type { Procedure } from '@/lib/types/handover'

interface Props {
  data: Procedure[]
  onChange: (data: Procedure[]) => void
}

function ProcedureItem({
  procedure,
  index,
  total,
  onUpdate,
  onMoveUp,
  onMoveDown,
  onRemove,
}: {
  procedure: Procedure
  index: number
  total: number
  onUpdate: (p: Procedure) => void
  onMoveUp: () => void
  onMoveDown: () => void
  onRemove: () => void
}) {
  const update = (field: keyof Procedure, value: string) =>
    onUpdate({ ...procedure, [field]: value })

  return (
    <div className="rounded-lg border border-border bg-background p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">手順 {index + 1}</span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={index === 0}
            onClick={onMoveUp}
            aria-label="上へ移動"
          >
            ↑
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={index === total - 1}
            onClick={onMoveDown}
            aria-label="下へ移動"
          >
            ↓
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onRemove}
            aria-label="手順を削除"
            className="text-destructive hover:text-destructive"
          >
            ✕
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {([
          ['title', '手順名', 'text'],
          ['timing', '実施タイミング', 'text'],
        ] as [keyof Procedure, string, string][]).map(([field, label, type]) => (
          <div key={field}>
            <label htmlFor={`${procedure.id}-${field}`} className="mb-1 block text-xs font-medium text-foreground">{label}</label>
            <input
              id={`${procedure.id}-${field}`}
              type={type}
              value={procedure[field] as string}
              onChange={(e) => update(field, e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/50"
            />
          </div>
        ))}

        {([
          ['description', '作業内容'],
          ['preCheck', '事前確認事項'],
          ['operation', '操作コマンド'],
          ['verification', '確認方法'],
          ['abortCondition', '中止条件'],
          ['rollback', 'ロールバック手順'],
          ['postCheck', '事後確認'],
          ['caution', '注意点'],
        ] as [keyof Procedure, string][]).map(([field, label]) => (
          <div key={field}>
            <label htmlFor={`${procedure.id}-${field}`} className="mb-1 block text-xs font-medium text-foreground">{label}</label>
            <textarea
              id={`${procedure.id}-${field}`}
              rows={2}
              value={procedure[field] as string}
              onChange={(e) => update(field, e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/50"
            />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function ProceduresSection({ data, onChange }: Props) {
  const addProcedure = () => {
    const newProcedure: Procedure = {
      id: crypto.randomUUID(),
      title: '',
      description: '',
      timing: '',
      preCheck: '',
      operation: '',
      verification: '',
      abortCondition: '',
      rollback: '',
      postCheck: '',
      caution: '',
      order: data.length,
    }
    onChange([...data, newProcedure])
  }

  const updateProcedure = (index: number, procedure: Procedure) => {
    const updated = data.map((p, i) => (i === index ? procedure : p))
    onChange(updated)
  }

  const removeProcedure = (index: number) => {
    const updated = data.filter((_, i) => i !== index).map((p, i) => ({ ...p, order: i }))
    onChange(updated)
  }

  const moveUp = (index: number) => {
    if (index === 0) return
    const updated = [...data]
    ;[updated[index - 1], updated[index]] = [updated[index], updated[index - 1]]
    onChange(updated.map((p, i) => ({ ...p, order: i })))
  }

  const moveDown = (index: number) => {
    if (index === data.length - 1) return
    const updated = [...data]
    ;[updated[index], updated[index + 1]] = [updated[index + 1], updated[index]]
    onChange(updated.map((p, i) => ({ ...p, order: i })))
  }

  return (
    <div className="space-y-4">
      {data.length === 0 && (
        <p className="text-sm text-muted-foreground">作業手順はまだありません。下のボタンで追加してください。</p>
      )}

      {data.map((procedure, index) => (
        <ProcedureItem
          key={procedure.id}
          procedure={procedure}
          index={index}
          total={data.length}
          onUpdate={(p) => updateProcedure(index, p)}
          onMoveUp={() => moveUp(index)}
          onMoveDown={() => moveDown(index)}
          onRemove={() => removeProcedure(index)}
        />
      ))}

      <Button variant="outline" size="sm" onClick={addProcedure}>
        ＋ 手順を追加
      </Button>
    </div>
  )
}
