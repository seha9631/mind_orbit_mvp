import { ArrowLeft } from 'lucide-react'
import { useCallback, useEffect, useState, type CSSProperties } from 'react'

import { Button } from '../../shared/ui/button'
import { Card, CardContent } from '../../shared/ui/card'
import { saveAppMeta } from '../../shared/lib/db'
import type { DeviceClass } from '../../shared/types/mindmap'
import { useAutoSaveMindMap } from './hooks/useAutoSaveMindMap'
import { useEditorKeyboard } from './hooks/useEditorKeyboard'
import { useMindMapEditor } from './hooks/useMindMapEditor'
import { EditorActionDock } from './components/EditorActionDock'
import { EditorBottomSheet } from './components/EditorBottomSheet'
import { FloatingAddButton } from './components/FloatingAddButton'
import { EditorKeyboardAddButtons } from './components/EditorKeyboardAddButtons'
import { MindMapCanvas } from './components/MindMapCanvas'
import { EditorTopBar } from './components/EditorTopBar'

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

  useEditorKeyboard(editor, deviceClass)

  useEffect(() => {
    if (!editor.map?.id) {
      return
    }

    void saveAppMeta({
      lastOpenedMapId: editor.map.id,
      lastScreen: 'editor',
    })
  }, [editor.map?.id])

  async function handleGoHome() {
    await flush()
    onGoHome()
  }

  const { selectNode, openSheet, addChild, addSibling, updateNodeSize } = editor

  const handleOpenMoreFromNode = useCallback(
    (nodeId: string) => {
      selectNode(nodeId)
      openSheet('more')
    },
    [openSheet, selectNode],
  )

  const handleQuickAddChild = useCallback(
    (nodeId: string) => {
      addChild(nodeId)
    },
    [addChild],
  )

  const handleQuickAddSibling = useCallback(
    (nodeId: string) => {
      addSibling(nodeId)
    },
    [addSibling],
  )

  const handleResizeNode = useCallback(
    (nodeId: string, size: { width: number; height: number }) => {
      updateNodeSize(nodeId, size)
    },
    [updateNodeSize],
  )

  if (editor.loading) {
    return (
      <div className="bg-editor-shell app-screen safe-page-x safe-page-y flex items-center justify-center">
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
      <div className="bg-editor-shell app-screen safe-page-x safe-page-y flex items-center justify-center">
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
    <main
      className="bg-editor-shell app-screen relative overflow-hidden"
      style={editorStyle}
    >
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
        map={editor.map}
        onChangeLabel={editor.changeNodeText}
        onMoveNode={editor.updateNodePosition}
        onOpenMore={handleOpenMoreFromNode}
        onQuickAddChild={handleQuickAddChild}
        onQuickAddSibling={handleQuickAddSibling}
        onResizeNode={handleResizeNode}
        onSelectNode={editor.selectNode}
        onSetViewport={editor.setViewportState}
        onStartEditing={editor.startEditing}
        onStopEditing={editor.stopEditing}
        selectedNodeId={editor.selectedNodeId}
      />

      {deviceClass === 'desktop' || !keyboardVisible ? (
        <EditorActionDock
          canAddSibling={canAddSibling}
          deviceClass={deviceClass}
          onAddChild={() => editor.addChild()}
          onAddSibling={() => editor.addSibling()}
          onOpenMore={() => editor.openSheet('more')}
          onOpenStyle={() => editor.openSheet('style')}
        />
      ) : null}

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