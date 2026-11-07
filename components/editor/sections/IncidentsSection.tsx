'use client'

import { Button } from '@/components/ui/button'
import type { IncidentResponse } from '@/lib/types/handover'

interface Props {
  data: IncidentResponse[]
  onChange: (data: IncidentResponse[]) => void
}

function IncidentItem({
  incident,
  index,
  onUpdate,
  onRemove,
}: {
  incident: IncidentResponse
  index: number
  onUpdate: (p: IncidentResponse) => void
  onRemove: () => void
}) {
  const update = (field: keyof IncidentResponse, value: string) =>
    onUpdate({ ...incident, [field]: value })

  return (
    <div className="rounded-lg border border-border bg-background p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">障害対応 {index + 1}</span>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onRemove}
          aria-label="障害対応を削除"
          className="text-destructive hover:text-destructive"
        >
          ✕
        </Button>
      </div>

      <div className="space-y-3">
        {([
          ['incident', '想定される障害', 'text'],
          ['escalation', 'エスカレーション先', 'text'],
        ] as [keyof IncidentResponse, string, string][]).map(([field, label]) => (
          <div key={field}>
            <label htmlFor={`${incident.id}-${field}`} className="mb-1 block text-xs font-medium text-foreground">{label}</label>
            <input
              id={`${incident.id}-${field}`}
              type="text"
              value={incident[field] as string}
              onChange={(e) => update(field, e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/50"
            />
          </div>
        ))}

        {([
          ['checks', '発生時の確認事項'],
          ['initialAction', '一次対応'],
          ['recoveryCheck', '復旧確認方法'],
          ['escalationCondition', 'エスカレーション条件'],
          ['caution', '注意点'],
        ] as [keyof IncidentResponse, string][]).map(([field, label]) => (
          <div key={field}>
            <label htmlFor={`${incident.id}-${field}`} className="mb-1 block text-xs font-medium text-foreground">{label}</label>
            <textarea
              id={`${incident.id}-${field}`}
              rows={2}
              value={incident[field] as string}
              onChange={(e) => update(field, e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/50"
            />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function IncidentsSection({ data, onChange }: Props) {
  const addIncident = () => {
    const newIncident: IncidentResponse = {
      id: crypto.randomUUID(),
      incident: '',
      checks: '',
      initialAction: '',
      recoveryCheck: '',
      escalation: '',
      escalationCondition: '',
      caution: '',
    }
    onChange([...data, newIncident])
  }

  const updateIncident = (index: number, incident: IncidentResponse) => {
    onChange(data.map((item, i) => (i === index ? incident : item)))
  }

  const removeIncident = (index: number) => {
    onChange(data.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-4">
      {data.length === 0 && (
        <p className="text-sm text-muted-foreground">障害対応はまだありません。下のボタンで追加してください。</p>
      )}

      {data.map((incident, index) => (
        <IncidentItem
          key={incident.id}
          incident={incident}
          index={index}
          onUpdate={(p) => updateIncident(index, p)}
          onRemove={() => removeIncident(index)}
        />
      ))}

      <Button variant="outline" size="sm" onClick={addIncident}>
        ＋ 障害対応を追加
      </Button>
    </div>
  )
}
