import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ReactFlow,
  type ReactFlowInstance,
  type XYPosition,
} from '@xyflow/react'
import type { MindMapNodeRecord } from '../../../shared/types/mindmap'

import { buildBranchColorMap, buildFlowEdges } from '../../../shared/lib/mapOperations'
import type { DeviceClass, MindMapRecord, ViewportState } from '../../../shared/types/mindmap'
import { MindMapNode } from './MindMapNode'
import type { MindFlowNode } from '../mindNodeTypes'

interface MindMapCanvasProps {
  deviceClass: DeviceClass
  editingNodeId: string | null
  fitViewToken: number
  isTouchPrimary: boolean
  keyboardVisible: boolean
  map: MindMapRecord
  onChangeLabel: (nodeId: string, value: string) => void
  onMoveNode: (nodeId: string, position: XYPosition) => void
  onOpenMore: (nodeId: string) => void
  onQuickAddChild: (nodeId: string) => void
  onSelectNode: (nodeId: string | null) => void
  onSetViewport: (viewport: ViewportState) => void
  onStartEditing: (nodeId: string) => void
  onStopEditing: () => void
  selectedNodeId: string | null
}

const nodeTypes = {
  mind: MindMapNode,
}

function isSamePosition(left: XYPosition, right: XYPosition) {
  return left.x === right.x && left.y === right.y
}

export function MindMapCanvas({
  deviceClass,
  editingNodeId,
  fitViewToken,
  isTouchPrimary,
  keyboardVisible,
  map,
  onChangeLabel,
  onMoveNode,
  onOpenMore,
  onQuickAddChild,
  onSelectNode,
  onSetViewport,
  onStartEditing,
  onStopEditing,
  selectedNodeId,
}: MindMapCanvasProps) {
  const [instance, setInstance] = useState<ReactFlowInstance | null>(null)
  const [dragPositions, setDragPositions] = useState<Record<string, XYPosition>>({})
  const initializedMapIdRef = useRef<string | null>(null)

  const effectiveMapNodes = useMemo(
    () =>
      map.nodes.map((node) => ({
        ...node,
        position: dragPositions[node.id] ?? node.position,
      })),
    [dragPositions, map.nodes],
  )

  const branchColors = useMemo(() => buildBranchColorMap(map), [map])
  const edges = useMemo(() => buildFlowEdges(map), [map])

  const nodes: MindFlowNode[] = useMemo(
    () =>
      effectiveMapNodes.map((node) => ({
        id: node.id,
        data: {
          color: branchColors.get(node.id) ?? '#89b6ff',
          deviceClass,
          id: node.id,
          isEditing: editingNodeId === node.id,
          isRoot: node.id === map.rootNodeId,
          label: node.text,
          placeholder: node.id === map.rootNodeId ? '중심 생각' : '생각 입력',
          onChangeLabel,
          onOpenMore,
          onQuickAddChild,
          onSelect: onSelectNode,
          onStartEditing,
          onStopEditing,
          touchPrimary: isTouchPrimary,
        },
        position: node.position,
        selected: selectedNodeId === node.id,
        type: 'mind',
      })),
    [
      branchColors,
      deviceClass,
      editingNodeId,
      effectiveMapNodes,
      isTouchPrimary,
      map.rootNodeId,
      onChangeLabel,
      onOpenMore,
      onQuickAddChild,
      onSelectNode,
      onStartEditing,
      onStopEditing,
      selectedNodeId,
    ],
  )

  useEffect(() => {
    if (!instance || fitViewToken === 0) {
      return
    }

    initializedMapIdRef.current = map.id
    void instance.fitView({ duration: 240, padding: 0.38 })
  }, [fitViewToken, instance, map.id])

  useEffect(() => {
    if (!instance || initializedMapIdRef.current === map.id) {
      return
    }

    initializedMapIdRef.current = map.id

    const isInitialViewport =
      map.viewport.x === 0 &&
      map.viewport.y === 0 &&
      map.viewport.zoom === 1 &&
      map.nodes.length <= 1

    if (isInitialViewport) {
      void instance.fitView({ duration: 0, padding: 0.45 })
      return
    }

    void instance.setViewport(
      {
        x: map.viewport.x,
        y: map.viewport.y,
        zoom: map.viewport.zoom,
      },
      { duration: 0 },
    )
  }, [instance, map.id, map.nodes.length, map.viewport.x, map.viewport.y, map.viewport.zoom])

  // 편집 중 매 키 입력마다 map.nodes 참조가 바뀌면 setCenter 애니메이션이
  // 재시작되면서 입력이 버벅거린다. 의존성에서 map.nodes를 빼고 최신 map은
  // ref로만 참조해서 "선택 변경 / 키보드 노출" 변화 때만 센터링한다.
  const mapRef = useRef(map)
  useEffect(() => {
    mapRef.current = map
  }, [map])

  useEffect(() => {
    if (!instance || !selectedNodeId || !keyboardVisible || deviceClass === 'desktop') {
      return
    }

    const node = mapRef.current.nodes.find(
      (candidate: MindMapNodeRecord) => candidate.id === selectedNodeId,
    )

    if (!node) {
      return
    }

    void instance.setCenter(node.position.x + 90, node.position.y + 28, {
      duration: 220,
      zoom: Math.max(instance.getZoom(), 0.95),
    })
  }, [deviceClass, instance, keyboardVisible, selectedNodeId])

  return (
    <div className="absolute inset-0 h-dvh min-h-dvh w-full min-h-svh">
      <ReactFlow
        className="!bg-transparent"
        edges={edges}
        fitView
        maxZoom={1.7}
        minZoom={0.45}
        nodeDragThreshold={4}
        nodeTypes={nodeTypes}
        nodes={nodes}
        nodesDraggable
        onInit={setInstance}
        onMoveEnd={(_event, viewport) => {
          onSetViewport({
            x: viewport.x,
            y: viewport.y,
            zoom: viewport.zoom,
          })
        }}
        onNodeDragStart={(_event, node) => {
          onStopEditing()
          onSelectNode(node.id)
        }}
        onNodeDrag={(_event, node) => {
          setDragPositions((current) => {
            const previousPosition = current[node.id]

            if (previousPosition && isSamePosition(previousPosition, node.position)) {
              return current
            }

            return {
              ...current,
              [node.id]: node.position,
            }
          })
        }}
        onNodeDragStop={(_event, node) => {
          onSelectNode(node.id)
          onMoveNode(node.id, node.position)
        }}
        onPaneClick={() => {
          onStopEditing()
          onSelectNode(null)
        }}
        panOnDrag
        preventScrolling
        zoomOnPinch
        zoomOnScroll={!isTouchPrimary}
      />
    </div>
  )
}