import type { ActiveSheet, DeviceClass, MindMapRecord } from '../../../shared/types/mindmap'
import { MoreSheetPanel } from './MoreSheetPanel'
import { StyleSheetPanel } from './StyleSheetPanel'

interface EditorBottomSheetProps {
  activeSheet: ActiveSheet
  canDelete: boolean
  canAddSibling: boolean
  deviceClass: DeviceClass
  map: MindMapRecord
  onAddChild: () => void
  onAddSibling: () => void
  onClose: () => void
  onDelete: () => void
  onStartEditing: () => void
}

export function EditorBottomSheet({
  activeSheet,
  canAddSibling,
  canDelete,
  deviceClass,
  map,
  onAddChild,
  onAddSibling,
  onClose,
  onDelete,
  onStartEditing,
}: EditorBottomSheetProps) {
  if (activeSheet === 'none' || activeSheet === 'create-map') {
    return null
  }

  if (activeSheet === 'style') {
    return (
      <StyleSheetPanel
        deviceClass={deviceClass}
        onClose={onClose}
      />
    )
  }

  return (
    <MoreSheetPanel
      canAddSibling={canAddSibling}
      canDelete={canDelete}
      deviceClass={deviceClass}
      map={map}
      onAddChild={onAddChild}
      onAddSibling={onAddSibling}
      onClose={onClose}
      onDelete={onDelete}
      onStartEditing={onStartEditing}
    />
  )
}