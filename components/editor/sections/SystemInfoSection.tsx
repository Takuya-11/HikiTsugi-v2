'use client'

import type { SystemInfo } from '@/lib/types/handover'

interface Props {
  data: SystemInfo
  onChange: (data: SystemInfo) => void
  errors?: { documentUrl?: string }
  documentUrlRef?: React.RefObject<HTMLInputElement | null>
}

export default function SystemInfoSection({ data, onChange, errors, documentUrlRef }: Props) {
  const update = (field: keyof SystemInfo, value: string) =>
    onChange({ ...data, [field]: value })

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="systemName" className="mb-1 block text-sm font-medium text-foreground">システム名</label>
          <input
            id="systemName"
            type="text"
            value={data.systemName}
            onChange={(e) => update('systemName', e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/50"
          />
        </div>
        <div>
          <label htmlFor="environment" className="mb-1 block text-sm font-medium text-foreground">環境区分</label>
          <input
            id="environment"
            type="text"
            value={data.environment}
            onChange={(e) => update('environment', e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/50"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="targetDevices" className="mb-1 block text-sm font-medium text-foreground">対象機器</label>
          <input
            id="targetDevices"
            type="text"
            value={data.targetDevices}
            onChange={(e) => update('targetDevices', e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/50"
          />
        </div>
        <div>
          <label htmlFor="osVersion" className="mb-1 block text-sm font-medium text-foreground">OS バージョン</label>
          <input
            id="osVersion"
            type="text"
            value={data.osVersion}
            onChange={(e) => update('osVersion', e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/50"
          />
        </div>
      </div>

      <div>
        <label htmlFor="tools" className="mb-1 block text-sm font-medium text-foreground">使用ツール</label>
        <textarea
          id="tools"
          rows={2}
          value={data.tools}
          onChange={(e) => update('tools', e.target.value)}
          className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/50"
        />
      </div>

      <div>
        <label htmlFor="connectionInfo" className="mb-1 block text-sm font-medium text-foreground">接続情報</label>
        <textarea
          id="connectionInfo"
          rows={3}
          value={data.connectionInfo}
          onChange={(e) => update('connectionInfo', e.target.value)}
          className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/50"
        />
      </div>

      <div>
        <label htmlFor="documentUrl" className="mb-1 block text-sm font-medium text-foreground">参考 URL</label>
        <input
          ref={documentUrlRef}
          id="documentUrl"
          type="url"
          value={data.documentUrl}
          onChange={(e) => update('documentUrl', e.target.value)}
          aria-invalid={!!errors?.documentUrl}
          aria-describedby={errors?.documentUrl ? 'documentUrl-error' : undefined}
          placeholder="https://"
          className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20"
        />
        {errors?.documentUrl && (
          <p id="documentUrl-error" className="mt-1 text-xs text-destructive">{errors.documentUrl}</p>
        )}
      </div>
    </div>
  )
}
