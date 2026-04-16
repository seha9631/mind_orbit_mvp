import { useEffect, useState } from 'react'

import { createDefaultMindMap } from '../../shared/lib/createDefaultMindMap'
import {
  deleteMindMap,
  getAppMeta,
  listMindMaps,
  saveAppMeta,
  saveMindMap,
  toggleMindMapFavorite,
} from '../../shared/lib/db'
import type { MindMapRecord } from '../../shared/types/mindmap'

function buildDefaultTitle(maps: MindMapRecord[]) {
  return maps.length === 0 ? '나의 새 마인드맵' : `나의 마인드맵 ${maps.length + 1}`
}

export function useMindMapsIndex() {
  const [maps, setMaps] = useState<MindMapRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function refresh() {
    try {
      setLoading(true)
      const nextMaps = await listMindMaps()
      setMaps(nextMaps)
      setError(null)
    } catch {
      setError('마인드맵 목록을 불러오지 못했어요.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void refresh()
  }, [])

  async function createMap(title: string) {
    const map = createDefaultMindMap(title || buildDefaultTitle(maps))

    await saveMindMap(map)
    await saveAppMeta({
      lastOpenedMapId: map.id,
      lastScreen: 'editor',
    })
    await refresh()

    return map
  }

  async function toggleFavorite(id: string) {
    await toggleMindMapFavorite(id)
    await refresh()
  }

  async function removeMap(id: string) {
    await deleteMindMap(id)

    const meta = await getAppMeta()

    if (meta?.lastOpenedMapId === id) {
      await saveAppMeta({
        lastOpenedMapId: undefined,
        lastScreen: 'dashboard',
      })
    }

    await refresh()
  }

  return {
    maps,
    loading,
    error,
    refresh,
    createMap,
    removeMap,
    toggleFavorite,
  }
}
