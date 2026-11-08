'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

export type SaveStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'failed' | 'conflict'

export interface ConflictInfo {
  serverVersion: number
}

interface DocumentData {
  title: string
  [key: string]: unknown
}

interface UseAutoSaveOptions {
  documentId: string
  initialVersion: number
}

interface UseAutoSaveReturn {
  saveStatus: SaveStatus
  conflictInfo: ConflictInfo | null
  triggerSave: (doc: DocumentData) => void
  resolveConflict: (resolution: 'useServer' | 'forceLocal') => void
}

const DEBOUNCE_MS = 2000

export function useAutoSave({ documentId, initialVersion }: UseAutoSaveOptions): UseAutoSaveReturn {
  const storageKey = `draft-${documentId}`

  const currentVersion = useRef(initialVersion)
  const pendingData = useRef<DocumentData | null>(null)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [conflictInfo, setConflictInfo] = useState<ConflictInfo | null>(null)

  const executeSave = useCallback(async (toSave: DocumentData) => {
    setSaveStatus('saving')

    try {
      const res = await fetch(`/api/documents/${documentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: toSave.title,
          data: toSave,
          version: currentVersion.current,
        }),
      })

      if (res.ok) {
        const { version } = await res.json()
        currentVersion.current = version
        if (pendingData.current === toSave) {
          localStorage.removeItem(storageKey)
          setSaveStatus('saved')
        } else {
          setSaveStatus('pending')
        }
      } else if (res.status === 409) {
        const { serverVersion } = await res.json()
        setConflictInfo({ serverVersion })
        setSaveStatus('conflict')
      } else {
        setSaveStatus('failed')
      }
    } catch {
      setSaveStatus('failed')
    }
  }, [documentId, storageKey])

  const triggerSave = useCallback((doc: DocumentData) => {
    localStorage.setItem(storageKey, JSON.stringify(doc))
    pendingData.current = doc
    setSaveStatus('pending')

    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => {
      if (pendingData.current) {
        executeSave(pendingData.current)
      }
    }, DEBOUNCE_MS)
  }, [storageKey, executeSave])

  const resolveConflict = useCallback((resolution: 'useServer' | 'forceLocal') => {
    if (!conflictInfo) return

    if (resolution === 'useServer') {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
        debounceTimer.current = null
      }
      localStorage.removeItem(storageKey)
      setConflictInfo(null)
      window.location.reload()
    } else {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
        debounceTimer.current = null
      }
      currentVersion.current = conflictInfo.serverVersion
      setConflictInfo(null)
      if (pendingData.current) {
        executeSave(pendingData.current)
      }
    }
  }, [conflictInfo, storageKey, executeSave])

  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
    }
  }, [])

  return { saveStatus, conflictInfo, triggerSave, resolveConflict }
}
