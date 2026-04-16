import { MoreHorizontal, Palette, ScanSearch } from 'lucide-react'

import { Badge } from '../../../shared/ui/badge'
import { Button } from '../../../shared/ui/button'
import { cn } from '../../../shared/lib/utils'
import type { DeviceClass } from '../../../shared/types/mindmap'
import type { SaveState } from '../hooks/useAutoSaveMindMap'

interface EditorTopBarProps {
  deviceClass: DeviceClass
  saveState: SaveState
  onOpenMore: () => void
  onOpenStyle: () => void
  onResetView: () => void
}

function getSaveLabel(saveState: EditorTopBarProps['saveState']) {
  switch (saveState) {
    case 'pending':
      return '저장 예정'
    case 'saving':
      return '저장 중'
    case 'error':
      return '저장 실패'
    case 'saved':
      return '오프라인 저장'
    default:
      return '준비됨'
  }
}

function getSaveBadgeClass(saveState: EditorTopBarProps['saveState']) {
  switch (saveState) {
    case 'pending':
    case 'saving':
      return 'bg-white/12 text-white'
    case 'error':
      return 'bg-red-500/15 text-red-50'
    case 'saved':
      return 'bg-primary/20 text-primary-foreground'
    default:
      return 'bg-white/12 text-white/82'
  }
}

export function EditorTopBar({
  deviceClass,
  saveState,
  onOpenMore,
  onOpenStyle,
  onResetView,
}: EditorTopBarProps) {
  return (
    <div
      className="absolute z-10 flex items-center gap-1.5 rounded-full border border-white/20 bg-black/78 p-1.5 shadow-[0_18px_36px_rgba(17,24,39,0.24)] backdrop-blur-xl"
      style={{
        right: 'max(1rem, env(safe-area-inset-right))',
        top: 'max(1rem, env(safe-area-inset-top))',
      }}
    >
      <Button
        className="size-10 bg-transparent px-0 shadow-none hover:bg-white/8"
        onClick={onResetView}
        size="icon"
        type="button"
        variant="glass"
      >
        <ScanSearch />
      </Button>
      <Button
        className="size-10 bg-transparent px-0 shadow-none hover:bg-white/8"
        onClick={onOpenStyle}
        size="icon"
        type="button"
        variant="glass"
      >
        <Palette />
      </Button>
      <Button
        className="size-10 bg-transparent px-0 shadow-none hover:bg-white/8"
        onClick={onOpenMore}
        size="icon"
        type="button"
        variant="glass"
      >
        <MoreHorizontal />
      </Button>
      <Badge
        className={cn(
          'ml-1 hidden border-transparent px-3 py-2 text-[11px] tracking-[0.16em] sm:inline-flex',
          getSaveBadgeClass(saveState),
          deviceClass === 'desktop' ? 'inline-flex' : '',
        )}
      >
        {getSaveLabel(saveState)}
      </Badge>
    </div>
  )
}
