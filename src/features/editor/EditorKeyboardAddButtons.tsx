import { GitBranchPlus, Plus } from 'lucide-react'

import { Button } from '../../components/ui/button'
import type { DeviceClass } from '../../types/mindmap'

interface EditorKeyboardAddButtonsProps {
  canAddSibling: boolean
  deviceClass: DeviceClass
  visible: boolean
  onAddChild: () => void
  onAddSibling: () => void
}

export function EditorKeyboardAddButtons({
  canAddSibling,
  deviceClass,
  visible,
  onAddChild,
  onAddSibling,
}: EditorKeyboardAddButtonsProps) {
  if (!visible || deviceClass === 'desktop') {
    return null
  }

  return (
    <>
      <Button
        className="absolute z-10 h-10 rounded-full bg-white/96 px-4 text-foreground shadow-[0_16px_28px_rgba(17,24,39,0.14)] hover:bg-white"
        onClick={onAddChild}
        style={{
          bottom: 'calc(max(0.4rem, env(safe-area-inset-bottom)) + var(--keyboard-safe-offset))',
          left: 'max(1rem, env(safe-area-inset-left))',
        }}
        type="button"
        variant="outline"
      >
        <Plus />
        <span>자식 노드</span>
      </Button>

      <Button
        className="absolute z-10 h-10 rounded-full bg-white/96 px-4 text-foreground shadow-[0_16px_28px_rgba(17,24,39,0.14)] hover:bg-white"
        disabled={!canAddSibling}
        onClick={onAddSibling}
        style={{
          bottom: 'calc(max(0.4rem, env(safe-area-inset-bottom)) + var(--keyboard-safe-offset))',
          right: 'max(1rem, env(safe-area-inset-right))',
        }}
        type="button"
        variant="outline"
      >
        <GitBranchPlus />
        <span>형제 노드</span>
      </Button>
    </>
  )
}
