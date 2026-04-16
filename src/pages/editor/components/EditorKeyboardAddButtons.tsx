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
      className="absolute left-1/2 z-10 w-[min(30rem,calc(100%-1.5rem))] -translate-x-1/2 rounded-[28px] border border-white/60 bg-white/94 p-2 shadow-[0_22px_44px_rgba(17,24,39,0.16)] backdrop-blur-xl"
      style={{
        bottom: 'calc(max(0.45rem, env(safe-area-inset-bottom)) + var(--keyboard-safe-offset))',
      }}
    >
      <div className="mb-2 px-2 text-[11px] font-medium tracking-[0.08em] text-foreground/52">
        {deviceClass === 'mobile' ? '입력 중에도 바로 이어쓰기' : '작성 흐름을 끊지 않고 노드 추가'}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button
          className="h-12 justify-center rounded-[20px] border-white/60 bg-white text-foreground shadow-none hover:bg-white"
          onClick={onAddChild}
          type="button"
          variant="outline"
        >
          <Plus />
          <span>자식 노드</span>
        </Button>

        <Button
          className="h-12 justify-center rounded-[20px] border-white/60 bg-white text-foreground shadow-none hover:bg-white"
          disabled={!canAddSibling}
          onClick={onAddSibling}
          type="button"
          variant="outline"
        >
          <GitBranchPlus />
          <span>형제 노드</span>
        </Button>
      </div>
    </div>
  )
}
