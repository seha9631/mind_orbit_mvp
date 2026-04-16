import { useEffect, useRef, useState } from 'react'

import { Button } from '../../shared/ui/button'
import { Input } from '../../shared/ui/input'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '../../shared/ui/sheet'
import type { DeviceClass } from '../../shared/types/mindmap'

interface CreateMapSheetProps {
  deviceClass: DeviceClass
  open: boolean
  onClose: () => void
  onCreate: (title: string) => Promise<void>
}

export function CreateMapSheet({ deviceClass, open, onClose, onCreate }: CreateMapSheetProps) {
  const [title, setTitle] = useState('')
  const [submitting, setSubmitting] = useState(false)
  // Ref prevents duplicate submissions when Enter + button click fire in the same
  // render cycle — React state updates are async and wouldn't block the second call.
  const pendingRef = useRef(false)

  useEffect(() => {
    if (!open) {
      setTitle('')
      setSubmitting(false)
      pendingRef.current = false
    }
  }, [open])

  async function handleSubmit() {
    if (pendingRef.current || !title.trim()) return
    try {
      pendingRef.current = true
      setSubmitting(true)
      await onCreate(title.trim())
    } finally {
      pendingRef.current = false
      setSubmitting(false)
    }
  }

  return (
    <Sheet onOpenChange={(next) => { if (!next) onClose() }} open={open}>
      <SheetContent
        aria-label="새 마인드맵 만들기"
        className="border-white/20 bg-[#171921]/95 text-white"
        side={deviceClass === 'desktop' ? 'right' : 'bottom'}
      >
        <div className="mx-auto h-1.5 w-14 rounded-full bg-white/18 md:hidden" />
        <SheetHeader className="space-y-1.5">
          <SheetTitle className="text-white">새 마인드맵</SheetTitle>
          <SheetDescription className="text-white/55">
            제목을 입력하면 바로 캔버스로 이동합니다.
          </SheetDescription>
        </SheetHeader>

        <label className="grid gap-2">
          <span className="text-sm font-medium text-white/78">제목</span>
          <Input
            autoFocus
            className="border-white/12 bg-white/8 text-white placeholder:text-white/35 focus-visible:ring-white/25"
            onChange={(event) => setTitle(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') void handleSubmit()
            }}
            placeholder="예: 브랜드 캠페인 아이디어"
            value={title}
          />
        </label>

        <SheetFooter className="pt-1">
          <Button
            className="border-white/20 text-white/80 hover:bg-white/8 hover:text-white"
            onClick={onClose}
            type="button"
            variant="outline"
          >
            취소
          </Button>
          <Button
            disabled={submitting || !title.trim()}
            onClick={() => void handleSubmit()}
            type="button"
          >
            {submitting ? '만드는 중...' : '만들기'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
