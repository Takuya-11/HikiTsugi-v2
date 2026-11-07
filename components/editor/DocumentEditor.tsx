'use client'

import { startTransition, useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useAutoSave } from '@/hooks/useAutoSave'
import BasicInfoSection from '@/components/editor/sections/BasicInfoSection'
import SystemInfoSection from '@/components/editor/sections/SystemInfoSection'
import ProceduresSection from '@/components/editor/sections/ProceduresSection'
import IncidentsSection from '@/components/editor/sections/IncidentsSection'
import PrecautionsSection from '@/components/editor/sections/PrecautionsSection'
import type {
  BasicInfo,
  HandoverDocument,
  IncidentResponse,
  Precautions,
  Procedure,
  Reference,
  SystemInfo,
} from '@/lib/types/handover'

type TabId = 'basicInfo' | 'systemInfo' | 'procedures' | 'incidents' | 'precautions'

type DocumentData = Omit<HandoverDocument, 'id' | 'userId' | 'version' | 'createdAt' | 'updatedAt'>

interface InitialDoc {
  id: string
  title: string
  data: DocumentData
  version: number
}

interface ValidationErrors {
  title?: string
  documentUrl?: string
  references?: Record<string, { url?: string }>
}

const TABS: { id: TabId; label: string }[] = [
  { id: 'basicInfo', label: '基本情報' },
  { id: 'systemInfo', label: 'システム情報' },
  { id: 'procedures', label: '作業手順' },
  { id: 'incidents', label: '障害対応' },
  { id: 'precautions', label: '注意・参考' },
]

function isValidUrl(value: string): boolean {
  try {
    new URL(value)
    return true
  } catch {
    return false
  }
}

export default function DocumentEditor({ initialDoc }: { initialDoc: InitialDoc }) {
  const storageKey = `draft-${initialDoc.id}`
  const router = useRouter()

  const [doc, setDoc] = useState<DocumentData>(initialDoc.data)
  const [title, setTitle] = useState(initialDoc.title)
  const [activeTab, setActiveTab] = useState<TabId>('basicInfo')
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [restoredFromLocal, setRestoredFromLocal] = useState(false)

  const titleInputRef = useRef<HTMLInputElement | null>(null)
  const documentUrlRef = useRef<HTMLInputElement | null>(null)

  const { saveStatus, conflictInfo, triggerSave, resolveConflict } = useAutoSave({
    documentId: initialDoc.id,
    initialVersion: initialDoc.version,
  })

  useEffect(() => {
    const stored = localStorage.getItem(storageKey)
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as DocumentData & { title?: string }
        startTransition(() => {
          setDoc(parsed)
          if (parsed.title) setTitle(parsed.title)
          setRestoredFromLocal(true)
        })
      } catch {
        localStorage.removeItem(storageKey)
      }
    }
  }, [storageKey])

  const triggerSaveWithTitle = useCallback((nextDoc: DocumentData, nextTitle: string) => {
    triggerSave({ ...nextDoc, title: nextTitle } as DocumentData & { title: string })
  }, [triggerSave])

  const updateBasicInfo = useCallback((basicInfo: BasicInfo) => {
    const nextTitle = basicInfo.title
    setDoc((prev) => {
      const updated = { ...prev, basicInfo }
      triggerSaveWithTitle(updated, nextTitle)
      return updated
    })
    setTitle(nextTitle)
  }, [triggerSaveWithTitle])

  const updateSystemInfo = useCallback((systemInfo: SystemInfo) => {
    setDoc((prev) => {
      const updated = { ...prev, systemInfo }
      triggerSaveWithTitle(updated, title)
      return updated
    })
  }, [triggerSaveWithTitle, title])

  const updateProcedures = useCallback((procedures: Procedure[]) => {
    setDoc((prev) => {
      const updated = { ...prev, procedures }
      triggerSaveWithTitle(updated, title)
      return updated
    })
  }, [triggerSaveWithTitle, title])

  const updateIncidents = useCallback((incidents: IncidentResponse[]) => {
    setDoc((prev) => {
      const updated = { ...prev, incidents }
      triggerSaveWithTitle(updated, title)
      return updated
    })
  }, [triggerSaveWithTitle, title])

  const updatePrecautions = useCallback((precautions: Precautions) => {
    setDoc((prev) => {
      const updated = { ...prev, precautions }
      triggerSaveWithTitle(updated, title)
      return updated
    })
  }, [triggerSaveWithTitle, title])

  const updateReferences = useCallback((references: Reference[]) => {
    setDoc((prev) => {
      const updated = { ...prev, references }
      triggerSaveWithTitle(updated, title)
      return updated
    })
  }, [triggerSaveWithTitle, title])

  const validate = (): boolean => {
    const newErrors: ValidationErrors = {}

    if (!doc.basicInfo.title.trim()) {
      newErrors.title = '業務名は必須です'
    }
    if (doc.systemInfo.documentUrl && !isValidUrl(doc.systemInfo.documentUrl)) {
      newErrors.documentUrl = '正しい URL 形式で入力してください'
    }

    const refErrors: Record<string, { url?: string }> = {}
    doc.references.forEach((ref) => {
      if (ref.url && !isValidUrl(ref.url)) {
        refErrors[ref.id] = { url: '正しい URL 形式で入力してください' }
      }
    })
    if (Object.keys(refErrors).length > 0) {
      newErrors.references = refErrors
    }

    setErrors(newErrors)

    if (newErrors.title) {
      setActiveTab('basicInfo')
      setTimeout(() => {
        titleInputRef.current?.scrollIntoView({ behavior: 'smooth' })
        titleInputRef.current?.focus()
      }, 50)
      return false
    }
    if (newErrors.documentUrl) {
      setActiveTab('systemInfo')
      setTimeout(() => {
        documentUrlRef.current?.scrollIntoView({ behavior: 'smooth' })
        documentUrlRef.current?.focus()
      }, 50)
      return false
    }

    return Object.keys(newErrors).length === 0
  }

  const saveStatusLabel = (() => {
    switch (saveStatus) {
      case 'pending':
      case 'saving':
        return { text: '保存中...', className: 'text-muted-foreground' }
      case 'saved':
        return { text: '保存済', className: 'text-green-600 dark:text-green-400' }
      case 'failed':
        return { text: '保存失敗 — ローカルに保存済', className: 'text-destructive' }
      case 'conflict':
        return { text: '競合を検知', className: 'text-destructive' }
      default:
        return null
    }
  })()

  return (
    <div className="mx-auto max-w-4xl px-4 pb-16">
      {restoredFromLocal && (
        <div className="mb-4 flex items-center justify-between rounded-md bg-muted px-4 py-2 text-sm text-muted-foreground">
          <span>ローカルバックアップから復元しました</span>
          <button
            onClick={() => setRestoredFromLocal(false)}
            className="ml-4 text-xs underline hover:no-underline"
          >
            閉じる
          </button>
        </div>
      )}

      <div className="mb-4 flex items-center justify-between gap-4">
        <input
          value={title}
          onChange={(e) => {
            const nextTitle = e.target.value
            setTitle(nextTitle)
            setDoc((prev) => {
              const updated = { ...prev, basicInfo: { ...prev.basicInfo, title: nextTitle } }
              triggerSave({ ...updated, title: nextTitle } as DocumentData & { title: string })
              return updated
            })
          }}
          placeholder="業務名を入力"
          className="flex-1 truncate rounded-md border border-transparent bg-transparent px-2 py-1 text-lg font-semibold text-foreground outline-none hover:border-border focus:border-ring focus:ring-2 focus:ring-ring/50"
        />
        <div className="flex shrink-0 items-center gap-3">
          {saveStatusLabel && (
            <span className={`text-xs ${saveStatusLabel.className}`}>{saveStatusLabel.text}</span>
          )}
          <Button variant="outline" size="sm" onClick={() => {
            if (validate()) {
              router.push(`/documents/${initialDoc.id}/preview`)
            }
          }}>
            プレビュー
          </Button>
          <Link href="/dashboard" className="text-sm text-muted-foreground hover:underline">
            ← 一覧へ
          </Link>
        </div>
      </div>

      <div className="mb-6 flex gap-1 border-b border-border">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div>
        {activeTab === 'basicInfo' && (
          <BasicInfoSection
            data={doc.basicInfo}
            onChange={updateBasicInfo}
            errors={{ title: errors.title }}
            titleRef={titleInputRef}
          />
        )}
        {activeTab === 'systemInfo' && (
          <SystemInfoSection
            data={doc.systemInfo}
            onChange={updateSystemInfo}
            errors={{ documentUrl: errors.documentUrl }}
            documentUrlRef={documentUrlRef}
          />
        )}
        {activeTab === 'procedures' && (
          <ProceduresSection data={doc.procedures} onChange={updateProcedures} />
        )}
        {activeTab === 'incidents' && (
          <IncidentsSection data={doc.incidents} onChange={updateIncidents} />
        )}
        {activeTab === 'precautions' && (
          <PrecautionsSection
            precautions={doc.precautions}
            references={doc.references}
            onPrecautionsChange={updatePrecautions}
            onReferencesChange={updateReferences}
            errors={{ references: errors.references }}
          />
        )}
      </div>

      {conflictInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 max-w-sm rounded-lg bg-background p-6 shadow-xl">
            <h2 className="mb-2 text-base font-semibold text-foreground">競合が検知されました</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              他のデバイスまたは別のタブでこのドキュメントが更新されました。どちらの内容を使用しますか？
            </p>
            <div className="flex flex-col gap-2">
              <Button
                onClick={() => resolveConflict('useServer')}
                variant="outline"
                className="w-full"
              >
                サーバーの内容を読み込む
              </Button>
              <Button
                onClick={() => resolveConflict('forceLocal')}
                variant="destructive"
                className="w-full"
              >
                自分の変更を上書きする
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
