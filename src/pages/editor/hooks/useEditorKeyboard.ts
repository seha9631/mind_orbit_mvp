import { useEffect } from 'react'

import type { DeviceClass } from '../../../shared/types/mindmap'

interface EditorKeyboardController {
  map: { rootNodeId: string } | null
  selectedNodeId: string | null
  editingNodeId: string | null
  addChild: (nodeId?: string) => void
  addSibling: (nodeId?: string) => void
  deleteSelected: (nodeId?: string) => void
  stopEditing: () => void
  closeSheet: () => void
}

function isTypingElement(element: HTMLElement | null) {
  return !!element && (
    element.tagName === 'INPUT' ||
    element.tagName === 'TEXTAREA' ||
    element.isContentEditable
  )
}

export function useEditorKeyboard(
  editor: EditorKeyboardController,
  deviceClass: DeviceClass,
) {
  useEffect(() => {
    if (deviceClass === 'mobile') {
      return
    }

    const handleKeydown = (event: KeyboardEvent) => {
      const activeElement = document.activeElement as HTMLElement | null
      const isTypingTarget = isTypingElement(activeElement)

      if (event.key === 'Escape') {
        editor.closeSheet()
        editor.stopEditing()
        return
      }

      if (editor.editingNodeId) {
        if (isTypingTarget) {
          return
        }

        if (event.key === 'Tab') {
          event.preventDefault()
          editor.addChild(editor.editingNodeId)
          return
        }

        if (event.key === 'Enter') {
          event.preventDefault()
          if (editor.editingNodeId === editor.map?.rootNodeId) {
            editor.addChild(editor.editingNodeId)
          } else {
            editor.addSibling(editor.editingNodeId)
          }
        }
        return
      }

      if (isTypingTarget) {
        return
      }

      if (event.key === 'Tab') {
        event.preventDefault()
        editor.addChild()
        return
      }

      if (event.key === 'Enter') {
        event.preventDefault()

        if (editor.selectedNodeId && editor.selectedNodeId !== editor.map?.rootNodeId) {
          editor.addSibling()
        } else {
          editor.addChild()
        }
        return
      }

      if ((event.key === 'Backspace' || event.key === 'Delete') && editor.selectedNodeId) {
        event.preventDefault()
        editor.deleteSelected()
      }
    }

    window.addEventListener('keydown', handleKeydown)

    return () => {
      window.removeEventListener('keydown', handleKeydown)
    }
  }, [deviceClass, editor])
}
