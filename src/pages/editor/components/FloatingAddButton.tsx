import { Plus } from 'lucide-react'

import { Button } from '../../../shared/ui/button'
import type { DeviceClass } from '../../../shared/types/mindmap'

interface FloatingAddButtonProps {
  deviceClass: DeviceClass
  onClick: () => void
  visible: boolean
}

export function FloatingAddButton({
  deviceClass,
  onClick,
  visible,
}: FloatingAddButtonProps) {
  if (!visible || deviceClass === 'desktop') {
    return null
  }

  return (
    <Button
      className="absolute z-10 h-12 rounded-full px-5"
      onClick={onClick}
      style={{
        bottom:
          'calc(max(1rem, env(safe-area-inset-bottom)) + 1rem + var(--keyboard-safe-offset))',
        right: 'max(1rem, env(safe-area-inset-right))',
      }}
      type="button"
    >
      <Plus />
      빠른 추가
    </Button>
  )
}
