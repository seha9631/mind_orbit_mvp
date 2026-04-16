import { ArrowLeft } from 'lucide-react'
import { useEffect, useState, type CSSProperties } from 'react'

import { Button } from '../../components/ui/button'
import { Card, CardContent } from '../../components/ui/card'
import { saveAppMeta } from '../../lib/db'
import type { DeviceClass } from '../../types/mindmap'
import { useAutoSaveMindMap } from '../../hooks/useAutoSaveMindMap'
import { useMindMapEditor } from '../../hooks/useMindMapEditor'
import { EditorActionDock } from './EditorActionDock'
import { EditorBottomSheet } from './EditorBottomSheet'
import { FloatingAddButton } from './FloatingAddButton'
import { EditorKeyboardAddButtons } from './EditorKeyboardAddButtons'
import { MindMapCanvas } from './MindMapCanvas'
import { EditorTopBar } from './EditorTopBar'

interface EditorPageProps {
  deviceClass: DeviceClass
  isTouchPrimary: boolean
  keyboardInset: number
  keyboardVisible: boolean
  mapId: string
  onGoHome: () => void
}

function formatSavedAt(value: string | null) {
  if (!value) {
    return '아직 저장 기록이 없어요.'
  }

  return new Intl.DateTimeFormat('ko-KR', {
    timeStyle: 'short',
  }).format(new Date(value))
}

export function EditorPage({
  deviceClass,
  isTouchPrimary,
  keyboardInset,
  keyboardVisible,
  mapId,
  onGoHome,
}: EditorPageProps) {
  const [fitViewToken, setFitViewToken] = useState(0)
  const editor = useMindMapEditor({
    deviceClass,
    keyboardVisible,
    mapId,
  })
  const { flush, lastSavedAt, saveStateLabel } = useAutoSaveMindMap({
    dirty: editor.isDirty,
    map: editor.map,
    onSaved: editor.markPersisted,
  })

  useEffect(() => {
    if (!editor.map) {
      return
    }

    void saveAppMeta({
      lastOpenedMapId: editor.map.id,
      lastScreen: 'editor',
    })
  }, [editor.map])

  useEffect(() => {
    if (deviceClass === 'mobile') {
      return
    }

    const handleKeydown = (event: KeyboardEvent) => {
      const activeElement = document.activeElement as HTMLElement | null
      const isTypingTarget =
        !!activeElement &&
        (activeElement.tagName === 'INPUT' ||
          activeElement.tagName === 'TEXTAREA' ||
          activeElement.isContentEditable)

      if (event.key === 'Escape') {
        editor.closeSheet()
        editor.stopEditing()
        return
      }

      if (editor.editingNodeId) {
        if (event.key === 'Enter') {
          event.preventDefault()
          editor.stopEditing()
        }
        return
      }

      if (isTypingTarget) {
        return
      }

      if (event.key === 'Tab') {
        event.preventDefault()
        editor.addChild()
      }

      if (event.key === 'Enter') {
        event.preventDefault()

        if (editor.selectedNodeId && editor.selectedNodeId !== editor.map?.rootNodeId) {
          editor.addSibling()
        } else {
          editor.addChild()
        }
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

  async function handleGoHome() {
    await flush()
    onGoHome()
  }

  if (editor.loading) {
    return (
      <div className="bg-editor-shell flex min-h-dvh min-h-svh items-center justify-center p-5">
        <Card className="w-full max-w-md bg-white/76">
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            마인드맵을 열고 있어요...
          </CardContent>
        </Card>
      </div>
    )
  }

  if (editor.error || !editor.map) {
    return (
      <div className="bg-editor-shell flex min-h-dvh min-h-svh items-center justify-center p-5">
        <Card className="w-full max-w-md bg-white/78">
          <CardContent className="grid gap-4 p-6 text-center">
            <p className="text-sm leading-6 text-muted-foreground">
              {editor.error ?? '마인드맵을 열 수 없어요.'}
            </p>
            <Button onClick={onGoHome} type="button">
              대시보드로 돌아가기
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const selectedNodeId = editor.selectedNodeId ?? editor.map.rootNodeId
  const canDelete = selectedNodeId !== editor.map.rootNodeId
  const canAddSibling = selectedNodeId !== editor.map.rootNodeId
  const keyboardSafeOffset =
    deviceClass === 'desktop' || !keyboardVisible ? 0 : Math.max(0, keyboardInset - 28)
  const editorStyle = {
    '--keyboard-safe-offset': `${keyboardSafeOffset}px`,
  } as CSSProperties

  return (
    <main className="bg-editor-shell relative min-h-dvh min-h-svh overflow-hidden" style={editorStyle}>
      <Button
        className="absolute z-10 size-12 rounded-full px-0"
        onClick={() => void handleGoHome()}
        style={{
          left: 'max(1rem, env(safe-area-inset-left))',
          top: 'max(1rem, env(safe-area-inset-top))',
        }}
        type="button"
        variant="glass"
      >
        <ArrowLeft />
      </Button>

      <EditorTopBar
        deviceClass={deviceClass}
        onOpenMore={() => editor.openSheet('more')}
        onOpenStyle={() => editor.openSheet('style')}
        onResetView={() => setFitViewToken((current) => current + 1)}
        saveState={saveStateLabel}
      />

      <Card
        className="pointer-events-none absolute z-10 max-w-[min(34rem,calc(100%-2rem))] border-white/50 bg-white/76"
        style={{
          left: 'max(1rem, env(safe-area-inset-left))',
          top: 'calc(max(1rem, env(safe-area-inset-top)) + 4.25rem)',
        }}
      >
        <CardContent className="grid gap-1 px-4 py-3">
          <strong className="text-sm font-semibold">{editor.map.title}</strong>
          <span className="text-xs text-muted-foreground">{formatSavedAt(lastSavedAt)}</span>
        </CardContent>
      </Card>

      <MindMapCanvas
        deviceClass={deviceClass}
        editingNodeId={editor.editingNodeId}
        fitViewToken={fitViewToken}
        isTouchPrimary={isTouchPrimary}
        keyboardVisible={keyboardVisible}
        map={editor.map}
        onChangeLabel={editor.changeNodeText}
        onMoveNode={editor.updateNodePosition}
        onOpenMore={(nodeId) => {
          editor.selectNode(nodeId)
          editor.openSheet('more')
        }}
        onQuickAddChild={(nodeId) => editor.addChild(nodeId)}
        onSelectNode={editor.selectNode}
        onSetViewport={editor.setViewportState}
        onStartEditing={editor.startEditing}
        onStopEditing={editor.stopEditing}
        selectedNodeId={editor.selectedNodeId}
      />

      <EditorActionDock
        canAddSibling={canAddSibling}
        deviceClass={deviceClass}
        onAddChild={() => editor.addChild()}
        onAddSibling={() => editor.addSibling()}
        onOpenMore={() => editor.openSheet('more')}
        onOpenStyle={() => editor.openSheet('style')}
      />

      <EditorKeyboardAddButtons
        canAddSibling={canAddSibling}
        deviceClass={deviceClass}
        onAddChild={() => editor.addChild()}
        onAddSibling={() => editor.addSibling()}
        visible={keyboardVisible && !!editor.editingNodeId}
      />

      <FloatingAddButton
        deviceClass={deviceClass}
        onClick={() => editor.addChild()}
        visible={!!editor.selectedNodeId && !keyboardVisible}
      />

      <EditorBottomSheet
        activeSheet={editor.activeSheet}
        canAddSibling={canAddSibling}
        canDelete={canDelete}
        deviceClass={deviceClass}
        map={editor.map}
        onAddChild={() => {
          editor.addChild()
          editor.closeSheet()
        }}
        onAddSibling={() => {
          editor.addSibling()
          editor.closeSheet()
        }}
        onClose={editor.closeSheet}
        onDelete={() => {
          editor.deleteSelected()
          editor.closeSheet()
        }}
        onStartEditing={() => {
          if (selectedNodeId) {
            editor.startEditing(selectedNodeId)
          }
          editor.closeSheet()
        }}
      />
    </main>
  )
}
