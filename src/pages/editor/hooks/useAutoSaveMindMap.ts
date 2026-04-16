import { useCallback, useEffect, useRef, useState } from 'react'

import { saveMindMap } from '../../../shared/lib/db'
import type { MindMapRecord } from '../../../shared/types/mindmap'

export type SaveState = 'idle' | 'pending' | 'saving' | 'saved' | 'error'

interface UseAutoSaveMindMapOptions {
  map: MindMapRecord | null
  dirty: boolean
  onSaved: (updatedAt: string) => void
}

interface UseAutoSaveMindMapResult {
  flush: () => Promise<void>
  lastSavedAt: string | null
  saveState: Exclude<SaveState, 'pending'>
  saveStateLabel: SaveState
}

export function useAutoSaveMindMap({
  map,
  dirty,
  onSaved,
}: UseAutoSaveMindMapOptions): UseAutoSaveMindMapResult {
  const [saveState, setSaveState] = useState<Exclude<SaveState, 'pending'>>('idle')
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null)
  const mapRef = useRef<MindMapRecord | null>(map)
  const dirtyRef = useRef(dirty)
  const timerRef = useRef<number | null>(null)
  const queueRef = useRef(Promise.resolve())
  const onSavedRef = useRef(onSaved)

  useEffect(() => {
    onSavedRef.current = onSaved
  }, [onSaved])

  const commitSave = useCallback(async (snapshot: MindMapRecord) => {
    setSaveState('saving')

    queueRef.current = queueRef.current.then(async () => {
      await saveMindMap(snapshot)
      onSavedRef.current(snapshot.updatedAt)
      setLastSavedAt(snapshot.updatedAt)
      setSaveState('saved')
    })

    try {
      await queueRef.current
    } catch {
      setSaveState('error')
    }
  }, [])

  useEffect(() => {
    mapRef.current = map
    dirtyRef.current = dirty
  }, [dirty, map])

  useEffect(() => {
    if (!map || !dirty) {
      return
    }

    if (timerRef.current) {
      window.clearTimeout(timerRef.current)
    }

    timerRef.current = window.setTimeout(() => {
      if (mapRef.current) {
        void commitSave(mapRef.current)
      }
    }, 450)

    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current)
      }
    }
  }, [commitSave, dirty, map])

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && mapRef.current && dirtyRef.current) {
        void commitSave(mapRef.current)
      }
    }

    window.addEventListener('pagehide', handleVisibilityChange)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('pagehide', handleVisibilityChange)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [commitSave])

  async function flush() {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current)
    }

    if (mapRef.current && dirtyRef.current) {
      await commitSave(mapRef.current)
    }
  }

  const saveStateLabel: SaveState =
    dirty && saveState !== 'saving' && saveState !== 'error' ? 'pending' : saveState

  return {
    flush,
    saveState,
    saveStateLabel,
    lastSavedAt,
  }
}
