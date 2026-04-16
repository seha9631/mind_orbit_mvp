import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ReactFlow,
  type ReactFlowInstance,
  type XYPosition,
} from '@xyflow/react'

import { buildBranchColorMap, buildFlowEdges } from '../../../shared/lib/mapOperations'
import type { DeviceClass, MindMapRecord, ViewportState } from '../../../shared/types/mindmap'
import { MindMapNode } from './MindMapNode'
import type { MindFlowNode } from '../mindNodeTypes'

interface MindMapCanvasProps {
  deviceClass: DeviceClass
  editingNodeId: string | null
  fitViewToken: number
  isTouchPrimary: boolean
  map: MindMapRecord
  onChangeLabel: (nodeId: string, value: string) => void
  onMoveNode: (nodeId: string, position: XYPosition) => void
  onOpenMore: (nodeId: string) => void
  onQuickAddChild: (nodeId: string) => void
  onQuickAddSibling: (nodeId: string) => void
  onResizeNode: (nodeId: string, size: { width: number; height: number }) => void
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

function getMinZoom(deviceClass: DeviceClass) {
  switch (deviceClass) {
    case 'mobile':
      return 0.16
    case 'tablet':
      return 0.28
    case 'desktop':
      return 0.45
  }
}

function getFitPadding(deviceClass: DeviceClass) {
  switch (deviceClass) {
    case 'mobile':
      return 0.26
    case 'tablet':
      return 0.34
    case 'desktop':
      return 0.38
  }
}

function getEditingFocusZoom(deviceClass: DeviceClass) {
  switch (deviceClass) {
    case 'mobile':
      return 0.68
    case 'tablet':
      return 0.82
    case 'desktop':
      return 1
  }
}

export function MindMapCanvas({
  deviceClass,
  editingNodeId,
  fitViewToken,
  isTouchPrimary,
  map,
  onChangeLabel,
  onMoveNode,
  onOpenMore,
  onQuickAddChild,
  onQuickAddSibling,
  onResizeNode,
  onSelectNode,
  onSetViewport,
  onStartEditing,
  onStopEditing,
  selectedNodeId,
}: MindMapCanvasProps) {
  const [instance, setInstance] = useState<ReactFlowInstance | null>(null)
  const [dragPositions, setDragPositions] = useState<Record<string, XYPosition>>({})
  const initializedMapIdRef = useRef<string | null>(null)
  const editingViewportRef = useRef<ViewportState | null>(null)
  const previousEditingNodeIdRef = useRef<string | null>(null)
  const minZoom = getMinZoom(deviceClass)
  const fitPadding = getFitPadding(deviceClass)
  const editingFocusZoom = getEditingFocusZoom(deviceClass)
  const shouldAutoFitViewport = deviceClass !== 'desktop'

  const effectiveMapNodes = useMemo(
    () =>
      map.nodes.map((node) => ({
        ...node,
        position: dragPositions[node.id] ?? node.position,
      })),
    [dragPositions, map.nodes],
  )

  const branchColors = buildBranchColorMap(map)
  const edges = buildFlowEdges(map)
  const rootNode = map.nodes.find((node) => node.id === map.rootNodeId)

  const nodes: MindFlowNode[] = effectiveMapNodes.map((node) => ({
    id: node.id,
    data: {
      branchSide:
        rootNode && node.id !== map.rootNodeId && node.position.x < rootNode.position.x
          ? 'left'
          : 'right',
      canAddSibling: node.id !== map.rootNodeId,
      color: branchColors.get(node.id) ?? '#89b6ff',
      deviceClass,
      id: node.id,
      isEditing: editingNodeId === node.id,
      isRoot: node.id === map.rootNodeId,
      label: node.text,
      onResizeEnd: onResizeNode,
      placeholder: node.id === map.rootNodeId ? '중심 생각' : '생각 입력',
      onChangeLabel,
      onOpenMore,
      onQuickAddChild,
      onQuickAddSibling,
      onSelect: onSelectNode,
      onStartEditing,
      onStopEditing,
      size: node.size,
      touchPrimary: isTouchPrimary,
    },
    position: node.position,
    selected: selectedNodeId === node.id,
    style: node.size
      ? {
          width: node.size.width,
          height: node.size.height,
        }
      : undefined,
    type: 'mind',
  }))

  useEffect(() => {
    editingViewportRef.current = null
    previousEditingNodeIdRef.current = null
  }, [map.id])

  useEffect(() => {
    if (!instance || fitViewToken === 0) {
      return
    }

    initializedMapIdRef.current = map.id
    void instance.fitView({ duration: 240, padding: fitPadding })
  }, [fitPadding, fitViewToken, instance, map.id])

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

    if (shouldAutoFitViewport || isInitialViewport) {
      void instance.fitView({ duration: 0, padding: fitPadding })
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
  }, [
    fitPadding,
    instance,
    map.id,
    map.nodes.length,
    map.viewport.x,
    map.viewport.y,
    map.viewport.zoom,
    shouldAutoFitViewport,
  ])

  useEffect(() => {
    if (!instance || deviceClass === 'desktop') {
      previousEditingNodeIdRef.current = editingNodeId
      return
    }

    const previousEditingNodeId = previousEditingNodeIdRef.current

    if (!previousEditingNodeId && editingNodeId) {
      editingViewportRef.current = instance.getViewport()
    }

    if (previousEditingNodeId && !editingNodeId) {
      previousEditingNodeIdRef.current = null

      if (editingViewportRef.current) {
        void instance.setViewport(editingViewportRef.current, { duration: 220 })
        editingViewportRef.current = null
      }

      return
    }

    if (!editingNodeId) {
      previousEditingNodeIdRef.current = null
      return
    }

    const node = map.nodes.find((candidate) => candidate.id === editingNodeId)

    if (!node) {
      previousEditingNodeIdRef.current = editingNodeId
      return
    }

    const nodeWidth = node.size?.width ?? 220
    const nodeHeight = node.size?.height ?? 56
    const currentZoom = instance.getZoom()
    const targetZoom = previousEditingNodeId
      ? currentZoom
      : Math.max(currentZoom, editingFocusZoom)

    void instance.setCenter(node.position.x + nodeWidth / 2, node.position.y + nodeHeight / 2, {
      duration: 220,
      zoom: targetZoom,
    })

    previousEditingNodeIdRef.current = editingNodeId
  }, [deviceClass, editingFocusZoom, editingNodeId, instance, map.nodes])

  return (
    <div className="app-screen-fixed absolute inset-0 w-full">
      <ReactFlow
        className="!bg-transparent"
        edges={edges}
        fitView
        maxZoom={1.7}
        minZoom={minZoom}
        nodeDragThreshold={4}
        nodeTypes={nodeTypes}
        nodes={nodes}
        nodesDraggable={!editingNodeId}
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
        zoomOnScroll={!isTouchPrimary && !editingNodeId}
      />
    </div>
  )
}
