import { GitBranchPlus, Plus } from 'lucide-react'

import { Button } from '../../../shared/ui/button'
import type { DeviceClass } from '../../../shared/types/mindmap'

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
    <div
      className="absolute inset-x-0 z-20 flex justify-center px-3"
      style={{
        bottom: 'max(0.5rem, calc(env(safe-area-inset-bottom) + 0.25rem))',
      }}
    >
      <div className="grid w-full max-w-[22rem] grid-cols-2 gap-2">
        <Button
          className="h-12 justify-center rounded-[20px] border-white/20 bg-black/82 text-white shadow-[0_16px_28px_rgba(17,24,39,0.18)] backdrop-blur-xl hover:bg-black/88"
          onClick={onAddChild}
          type="button"
          variant="glass"
        >
          <Plus />
          <span>자식 노드</span>
        </Button>

        <Button
          className="h-12 justify-center rounded-[20px] border-white/20 bg-black/82 text-white shadow-[0_16px_28px_rgba(17,24,39,0.18)] backdrop-blur-xl hover:bg-black/88"
          disabled={!canAddSibling}
          onClick={onAddSibling}
          type="button"
          variant="glass"
        >
          <GitBranchPlus />
          <span>형제 노드</span>
        </Button>
      </div>
    </div>
  )
}
