import type { ReactNode } from 'react'

import { Badge } from '../../../shared/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '../../../shared/ui/sheet'
import type { DeviceClass } from '../../../shared/types/mindmap'

interface BaseEditorSheetProps {
  ariaLabel: string
  badgeLabel: string
  title: string
  description: string
  deviceClass: DeviceClass
  onClose: () => void
  children: ReactNode
}

export function BaseEditorSheet({
  ariaLabel,
  badgeLabel,
  title,
  description,
  deviceClass,
  onClose,
  children,
}: BaseEditorSheetProps) {
  return (
    <Sheet
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onClose()
        }
      }}
      open
    >
      <SheetContent
        aria-label={ariaLabel}
        className="border-white/20 bg-[#171921]/95 text-white"
        side={deviceClass === 'desktop' ? 'right' : 'bottom'}
      >
        <div className="mx-auto h-1.5 w-14 rounded-full bg-white/18 md:hidden" />

        <SheetHeader className="space-y-3">
          <Badge className="w-fit bg-white/10 text-white">{badgeLabel}</Badge>
          <SheetTitle className="text-white">{title}</SheetTitle>
          <SheetDescription className="text-white/65">{description}</SheetDescription>
        </SheetHeader>

        {children}
      </SheetContent>
    </Sheet>
  )
}