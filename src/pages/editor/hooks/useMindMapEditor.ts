import { useEffect, useState } from 'react'
import type { XYPosition } from '@xyflow/react'

import { getMindMap, saveAppMeta } from '../../../shared/lib/db'
import {
  addChildNode,
  addSiblingNode,
  removeNode,
  sanitizeMindMap,
  updateNodeText,
  updateViewport,
  moveNode,
} from '../../../shared/lib/mapOperations'
import type { ActiveSheet, DeviceClass, MindMapRecord, ViewportState } from '../../../shared/types/mindmap'

interface UseMindMapEditorOptions {
  mapId: string
  deviceClass: DeviceClass
  keyboardVisible: boolean
}

export function useMindMapEditor({
  mapId,
  deviceClass,
  keyboardVisible,
}: UseMindMapEditorOptions) {
  const [map, setMap] = useState<MindMapRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null)
  const [activeSheet, setActiveSheet] = useState<ActiveSheet>('none')
  const [lastPersistedUpdatedAt, setLastPersistedUpdatedAt] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadMap() {
      try {
        setLoading(true)
        const nextMap = await getMindMap(mapId)

        if (cancelled) {
          return
        }

        if (!nextMap) {
          void saveAppMeta({
            lastOpenedMapId: undefined,
            lastScreen: 'dashboard',
          })
          setError('마인드맵을 찾을 수 없어요.')
          setMap(null)
          return
        }

        const safeMap = sanitizeMindMap(nextMap)

        setMap(safeMap)
        setSelectedNodeId(safeMap.rootNodeId)
        setEditingNodeId(null)
        setActiveSheet('none')
        setLastPersistedUpdatedAt(safeMap.updatedAt)
        setError(null)
      } catch {
        if (!cancelled) {
          setError('마인드맵을 불러오지 못했어요.')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadMap()

    return () => {
      cancelled = true
    }
  }, [mapId])

  useEffect(() => {
    if (deviceClass === 'desktop' || !keyboardVisible) {
      return
    }

    setActiveSheet('none')
  }, [deviceClass, keyboardVisible])

  const isDirty = !!map && lastPersistedUpdatedAt !== map.updatedAt

  function selectNode(nodeId: string | null) {
    setSelectedNodeId(nodeId)
  }

  function startEditing(nodeId: string) {
    setSelectedNodeId(nodeId)
    setEditingNodeId(nodeId)
    setActiveSheet('none')
  }

  function stopEditing() {
    setEditingNodeId(null)
  }

  function changeNodeText(nodeId: string, text: string) {
    setMap((current) => (current ? updateNodeText(current, nodeId, text) : current))
  }

  function addChild(nodeId = selectedNodeId ?? map?.rootNodeId ?? '') {
    setMap((current) => {
      if (!current) {
        return current
      }

      const result = addChildNode(current, nodeId)
      setSelectedNodeId(result.createdNodeId)
      setEditingNodeId(result.createdNodeId)
      setActiveSheet('none')
      return result.map
    })
  }

  function addSibling(nodeId = selectedNodeId ?? map?.rootNodeId ?? '') {
    setMap((current) => {
      if (!current) {
        return current
      }

      const result = addSiblingNode(current, nodeId)
      setSelectedNodeId(result.createdNodeId)
      setEditingNodeId(result.createdNodeId)
      setActiveSheet('none')
      return result.map
    })
  }

  function deleteSelected(nodeId = selectedNodeId ?? '') {
    setMap((current) => {
      if (!current) {
        return current
      }

      const result = removeNode(current, nodeId)
      setSelectedNodeId(result.nextSelectedNodeId)
      setEditingNodeId(null)
      setActiveSheet('none')
      return result.map
    })
  }

  function updateNodePosition(nodeId: string, position: XYPosition) {
    setMap((current) => (current ? moveNode(current, nodeId, position) : current))
  }

  function setViewportState(viewport: ViewportState) {
    setMap((current) => (current ? updateViewport(current, viewport) : current))
  }

  function openSheet(sheet: ActiveSheet) {
    setActiveSheet(sheet)
    setEditingNodeId(null)
  }

  function closeSheet() {
    setActiveSheet('none')
  }

  function markPersisted(updatedAt: string) {
    setLastPersistedUpdatedAt(updatedAt)
  }

  return {
    map,
    loading,
    error,
    isDirty,
    selectedNodeId,
    editingNodeId,
    activeSheet,
    keyboardVisible,
    deviceClass,
    selectNode,
    startEditing,
    stopEditing,
    changeNodeText,
    addChild,
    addSibling,
    deleteSelected,
    updateNodePosition,
    setViewportState,
    openSheet,
    closeSheet,
    markPersisted,
  }
}
