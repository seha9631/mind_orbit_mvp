import { GitBranchPlus, MoreHorizontal, Palette, Plus } from 'lucide-react'

import { Button } from '../../../shared/ui/button'
import type { DeviceClass } from '../../../shared/types/mindmap'

interface EditorActionDockProps {
  canAddSibling: boolean
  deviceClass: DeviceClass
  onAddChild: () => void
  onAddSibling: () => void
  onOpenMore: () => void
  onOpenStyle: () => void
}

export function EditorActionDock({
  canAddSibling,
  deviceClass,
  onAddChild,
  onAddSibling,
  onOpenMore,
  onOpenStyle,
}: EditorActionDockProps) {
  return (
    <div
      className="absolute left-1/2 z-10 flex -translate-x-1/2 items-center gap-1 rounded-full border border-white/18 bg-black/82 p-1.5 shadow-[0_20px_36px_rgba(17,24,39,0.2)] backdrop-blur-xl"
      style={{
        bottom:
          'calc(max(1rem, env(safe-area-inset-bottom)) + 0.75rem + var(--keyboard-safe-offset))',
      }}
    >
      <Button
        className="h-11 bg-transparent shadow-none hover:bg-white/8"
        onClick={onAddChild}
        size={deviceClass === 'desktop' ? 'default' : 'icon'}
        type="button"
        variant="glass"
      >
        <Plus />
        {deviceClass === 'desktop' ? '자식' : null}
      </Button>
      <Button
        className="h-11 bg-transparent shadow-none hover:bg-white/8"
        disabled={!canAddSibling}
        onClick={onAddSibling}
        size={deviceClass === 'desktop' ? 'default' : 'icon'}
        type="button"
        variant="glass"
      >
        <GitBranchPlus />
        {deviceClass === 'desktop' ? '형제' : null}
      </Button>
      <Button
        className="h-11 bg-transparent shadow-none hover:bg-white/8"
        onClick={onOpenStyle}
        size={deviceClass === 'desktop' ? 'default' : 'icon'}
        type="button"
        variant="glass"
      >
        <Palette />
        {deviceClass === 'desktop' ? '스타일' : null}
      </Button>
      <Button
        className="h-11 bg-transparent shadow-none hover:bg-white/8"
        onClick={onOpenMore}
        size={deviceClass === 'desktop' ? 'default' : 'icon'}
        type="button"
        variant="glass"
      >
        <MoreHorizontal />
        {deviceClass === 'desktop' ? '더보기' : null}
      </Button>
    </div>
  )
}
