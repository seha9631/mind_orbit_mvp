import type { Node } from '@xyflow/react'

import type { DeviceClass, NodeSize } from '../../shared/types/mindmap'

export type MindNodeBranchSide = 'left' | 'right'

type MindNodeAction =
  | (() => void)
  | ((nodeId: string) => void)
  | ((nodeId: string | null) => void)
  | ((nodeId: string, value: string) => void)
  | ((nodeId: string, size: NodeSize) => void)

type MindNodeValue = string | boolean | DeviceClass | MindNodeAction | NodeSize | undefined

export interface MindMapNodeData extends Record<string, MindNodeValue> {
  branchSide: MindNodeBranchSide
  canAddSibling: boolean
  color: string
  deviceClass: DeviceClass
  id: string
  isEditing: boolean
  isRoot: boolean
  label: string
  placeholder: string
  onChangeLabel: (nodeId: string, value: string) => void
  onOpenMore: (nodeId: string) => void
  onQuickAddChild: (nodeId: string) => void
  onQuickAddSibling: (nodeId: string) => void
  onResizeEnd: (nodeId: string, size: NodeSize) => void
  onSelect: (nodeId: string | null) => void
  onStartEditing: (nodeId: string) => void
  onStopEditing: () => void
  size?: NodeSize
  touchPrimary: boolean
}

export type MindFlowNode = Node<MindMapNodeData, 'mind'>
