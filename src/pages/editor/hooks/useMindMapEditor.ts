import { useEffect, useReducer } from 'react'
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
  resizeNode,
} from '../../../shared/lib/mapOperations'
import type {
  ActiveSheet,
  DeviceClass,
  MindMapRecord,
  NodeSize,
  ViewportState,
} from '../../../shared/types/mindmap'

interface UseMindMapEditorOptions {
  mapId: string
  deviceClass: DeviceClass
  keyboardVisible: boolean
}

interface MindMapEditorState {
  map: MindMapRecord | null
  loading: boolean
  error: string | null
  selectedNodeId: string | null
  editingNodeId: string | null
  activeSheet: ActiveSheet
  lastPersistedUpdatedAt: string | null
}

type MindMapEditorAction =
  | { type: 'LOAD_START' }
  | { type: 'LOAD_SUCCESS'; payload: MindMapRecord }
  | { type: 'LOAD_NOT_FOUND' }
  | { type: 'LOAD_ERROR'; payload: string }
  | { type: 'SELECT_NODE'; payload: string | null }
  | { type: 'START_EDITING'; payload: string }
  | { type: 'STOP_EDITING' }
  | { type: 'CHANGE_NODE_TEXT'; payload: { nodeId: string; text: string } }
  | { type: 'ADD_CHILD'; payload: { nodeId: string } }
  | { type: 'ADD_SIBLING'; payload: { nodeId: string } }
  | { type: 'DELETE_SELECTED'; payload: { nodeId: string } }
  | { type: 'UPDATE_NODE_POSITION'; payload: { nodeId: string; position: XYPosition } }
  | { type: 'UPDATE_NODE_SIZE'; payload: { nodeId: string; size: NodeSize } }
  | { type: 'SET_VIEWPORT'; payload: ViewportState }
  | { type: 'OPEN_SHEET'; payload: ActiveSheet }
  | { type: 'CLOSE_SHEET' }
  | { type: 'CLOSE_SHEET_FOR_KEYBOARD' }
  | { type: 'MARK_PERSISTED'; payload: string }

const initialState: MindMapEditorState = {
  map: null,
  loading: true,
  error: null,
  selectedNodeId: null,
  editingNodeId: null,
  activeSheet: 'none',
  lastPersistedUpdatedAt: null,
}

function mindMapEditorReducer(
  state: MindMapEditorState,
  action: MindMapEditorAction,
): MindMapEditorState {
  switch (action.type) {
    case 'LOAD_START':
      return {
        ...state,
        loading: true,
        error: null,
      }

    case 'LOAD_SUCCESS': {
      const safeMap = action.payload

      return {
        ...state,
        map: safeMap,
        loading: false,
        error: null,
        selectedNodeId: safeMap.rootNodeId,
        editingNodeId: null,
        activeSheet: 'none',
        lastPersistedUpdatedAt: safeMap.updatedAt,
      }
    }

    case 'LOAD_NOT_FOUND':
      return {
        ...state,
        map: null,
        loading: false,
        error: '마인드맵을 찾을 수 없어요.',
      }

    case 'LOAD_ERROR':
      return {
        ...state,
        loading: false,
        error: action.payload,
      }

    case 'SELECT_NODE':
      return {
        ...state,
        selectedNodeId: action.payload,
      }

    case 'START_EDITING':
      return {
        ...state,
        selectedNodeId: action.payload,
        editingNodeId: action.payload,
        activeSheet: 'none',
      }

    case 'STOP_EDITING':
      return {
        ...state,
        editingNodeId: null,
      }

    case 'CHANGE_NODE_TEXT': {
      if (!state.map) {
        return state
      }

      return {
        ...state,
        map: updateNodeText(state.map, action.payload.nodeId, action.payload.text),
      }
    }

    case 'ADD_CHILD': {
      if (!state.map) {
        return state
      }

      const result = addChildNode(state.map, action.payload.nodeId)

      return {
        ...state,
        map: result.map,
        selectedNodeId: result.createdNodeId,
        editingNodeId: result.createdNodeId,
        activeSheet: 'none',
      }
    }

    case 'ADD_SIBLING': {
      if (!state.map) {
        return state
      }

      const result = addSiblingNode(state.map, action.payload.nodeId)

      return {
        ...state,
        map: result.map,
        selectedNodeId: result.createdNodeId,
        editingNodeId: result.createdNodeId,
        activeSheet: 'none',
      }
    }

    case 'DELETE_SELECTED': {
      if (!state.map) {
        return state
      }

      const result = removeNode(state.map, action.payload.nodeId)

      return {
        ...state,
        map: result.map,
        selectedNodeId: result.nextSelectedNodeId,
        editingNodeId: null,
        activeSheet: 'none',
      }
    }

    case 'UPDATE_NODE_POSITION': {
      if (!state.map) {
        return state
      }

      return {
        ...state,
        map: moveNode(state.map, action.payload.nodeId, action.payload.position),
      }
    }

    case 'UPDATE_NODE_SIZE': {
      if (!state.map) {
        return state
      }

      return {
        ...state,
        map: resizeNode(state.map, action.payload.nodeId, action.payload.size),
      }
    }

    case 'SET_VIEWPORT': {
      if (!state.map) {
        return state
      }

      return {
        ...state,
        map: updateViewport(state.map, action.payload),
      }
    }

    case 'OPEN_SHEET':
      return {
        ...state,
        activeSheet: action.payload,
        editingNodeId: null,
      }

    case 'CLOSE_SHEET':
      return {
        ...state,
        activeSheet: 'none',
      }

    case 'CLOSE_SHEET_FOR_KEYBOARD':
      return {
        ...state,
        activeSheet: 'none',
      }

    case 'MARK_PERSISTED':
      return {
        ...state,
        lastPersistedUpdatedAt: action.payload,
      }

    default:
      return state
  }
}

export function useMindMapEditor({
  mapId,
  deviceClass,
  keyboardVisible,
}: UseMindMapEditorOptions) {
  const [state, dispatch] = useReducer(mindMapEditorReducer, initialState)

  useEffect(() => {
    let cancelled = false

    async function loadMap() {
      dispatch({ type: 'LOAD_START' })

      try {
        const nextMap = await getMindMap(mapId)

        if (cancelled) {
          return
        }

        if (!nextMap) {
          void saveAppMeta({
            lastOpenedMapId: undefined,
            lastScreen: 'dashboard',
          })

          dispatch({ type: 'LOAD_NOT_FOUND' })
          return
        }

        const safeMap = sanitizeMindMap(nextMap)
        dispatch({ type: 'LOAD_SUCCESS', payload: safeMap })
      } catch {
        if (!cancelled) {
          dispatch({
            type: 'LOAD_ERROR',
            payload: '마인드맵을 불러오지 못했어요.',
          })
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

    dispatch({ type: 'CLOSE_SHEET_FOR_KEYBOARD' })
  }, [deviceClass, keyboardVisible])

  const isDirty = !!state.map && state.lastPersistedUpdatedAt !== state.map.updatedAt

  function selectNode(nodeId: string | null) {
    dispatch({ type: 'SELECT_NODE', payload: nodeId })
  }

  function startEditing(nodeId: string) {
    dispatch({ type: 'START_EDITING', payload: nodeId })
  }

  function stopEditing() {
    dispatch({ type: 'STOP_EDITING' })
  }

  function changeNodeText(nodeId: string, text: string) {
    dispatch({
      type: 'CHANGE_NODE_TEXT',
      payload: { nodeId, text },
    })
  }

  function addChild(nodeId = state.selectedNodeId ?? state.map?.rootNodeId ?? '') {
    dispatch({
      type: 'ADD_CHILD',
      payload: { nodeId },
    })
  }

  function addSibling(nodeId = state.selectedNodeId ?? state.map?.rootNodeId ?? '') {
    dispatch({
      type: 'ADD_SIBLING',
      payload: { nodeId },
    })
  }

  function deleteSelected(nodeId = state.selectedNodeId ?? '') {
    dispatch({
      type: 'DELETE_SELECTED',
      payload: { nodeId },
    })
  }

  function updateNodePosition(nodeId: string, position: XYPosition) {
    dispatch({
      type: 'UPDATE_NODE_POSITION',
      payload: { nodeId, position },
    })
  }

  function updateNodeSize(nodeId: string, size: NodeSize) {
    dispatch({
      type: 'UPDATE_NODE_SIZE',
      payload: { nodeId, size },
    })
  }

  function setViewportState(viewport: ViewportState) {
    dispatch({
      type: 'SET_VIEWPORT',
      payload: viewport,
    })
  }

  function openSheet(sheet: ActiveSheet) {
    dispatch({
      type: 'OPEN_SHEET',
      payload: sheet,
    })
  }

  function closeSheet() {
    dispatch({ type: 'CLOSE_SHEET' })
  }

  function markPersisted(updatedAt: string) {
    dispatch({
      type: 'MARK_PERSISTED',
      payload: updatedAt,
    })
  }

  return {
    map: state.map,
    loading: state.loading,
    error: state.error,
    isDirty,
    selectedNodeId: state.selectedNodeId,
    editingNodeId: state.editingNodeId,
    activeSheet: state.activeSheet,
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
    updateNodeSize,
    setViewportState,
    openSheet,
    closeSheet,
    markPersisted,
  }
}
