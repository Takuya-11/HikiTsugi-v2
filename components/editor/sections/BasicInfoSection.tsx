'use client'

import type { BasicInfo } from '@/lib/types/handover'

interface Props {
  data: BasicInfo
  onChange: (data: BasicInfo) => void
  errors?: { title?: string }
  titleRef?: React.RefObject<HTMLInputElement | null>
}

export default function BasicInfoSection({ data, onChange, errors, titleRef }: Props) {
  const update = (field: keyof BasicInfo, value: string) =>
    onChange({ ...data, [field]: value })

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="title" className="mb-1 block text-sm font-medium text-foreground">
          業務名 <span className="text-destructive">*</span>
        </label>
        <input
          ref={titleRef}
          id="title"
          type="text"
          value={data.title}
          onChange={(e) => update('title', e.target.value)}
          aria-invalid={!!errors?.title}
          aria-describedby={errors?.title ? 'title-error' : undefined}
          className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20"
        />
        {errors?.title && (
          <p id="title-error" className="mt-1 text-xs text-destructive">{errors.title}</p>
        )}
      </div>

      <div>
        <label htmlFor="overview" className="mb-1 block text-sm font-medium text-foreground">業務概要</label>
        <textarea
          id="overview"
          rows={3}
          value={data.overview}
          onChange={(e) => update('overview', e.target.value)}
          className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/50"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="fromPerson" className="mb-1 block text-sm font-medium text-foreground">引き継ぎ元担当者</label>
          <input
            id="fromPerson"
            type="text"
            value={data.fromPerson}
            onChange={(e) => update('fromPerson', e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/50"
          />
        </div>
        <div>
          <label htmlFor="toPerson" className="mb-1 block text-sm font-medium text-foreground">引き継ぎ先担当者</label>
          <input
            id="toPerson"
            type="text"
            value={data.toPerson}
            onChange={(e) => update('toPerson', e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/50"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="category" className="mb-1 block text-sm font-medium text-foreground">業務カテゴリ</label>
          <input
            id="category"
            type="text"
            value={data.category}
            onChange={(e) => update('category', e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/50"
          />
        </div>
        <div>
          <label htmlFor="frequency" className="mb-1 block text-sm font-medium text-foreground">実施頻度</label>
          <input
            id="frequency"
            type="text"
            value={data.frequency}
            onChange={(e) => update('frequency', e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/50"
          />
        </div>
      </div>

      <div>
        <label htmlFor="createdAt" className="mb-1 block text-sm font-medium text-foreground">作成日</label>
        <input
          id="createdAt"
          type="date"
          value={data.createdAt}
          onChange={(e) => update('createdAt', e.target.value)}
          className="rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/50"
        />
      </div>
    </div>
  )
}
