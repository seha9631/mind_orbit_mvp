import type { Node } from '@xyflow/react'

import type { DeviceClass } from '../../types/mindmap'

type MindNodeAction =
  | (() => void)
  | ((nodeId: string) => void)
  | ((nodeId: string | null) => void)
  | ((nodeId: string, value: string) => void)

type MindNodeValue = string | boolean | DeviceClass | MindNodeAction

export interface MindMapNodeData extends Record<string, MindNodeValue> {
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
  onSelect: (nodeId: string | null) => void
  onStartEditing: (nodeId: string) => void
  onStopEditing: () => void
  touchPrimary: boolean
}

export type MindFlowNode = Node<MindMapNodeData, 'mind'>
