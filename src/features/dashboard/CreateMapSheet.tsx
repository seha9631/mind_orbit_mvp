import { useEffect, useState } from 'react'
import { FolderPlus, Sparkles } from 'lucide-react'

import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Card, CardContent } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '../../components/ui/sheet'
import type { DeviceClass } from '../../types/mindmap'

interface CreateMapSheetProps {
  deviceClass: DeviceClass
  open: boolean
  onClose: () => void
  onCreate: (title: string) => Promise<void>
}

export function CreateMapSheet({
  deviceClass,
  open,
  onClose,
  onCreate,
}: CreateMapSheetProps) {
  const [title, setTitle] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) {
      setTitle('')
      setSubmitting(false)
    }
  }, [open])

  if (!open) {
    return null
  }

  async function handleCreate() {
    try {
      setSubmitting(true)
      await onCreate(title)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Sheet
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onClose()
        }
      }}
      open={open}
    >
      <SheetContent
        aria-label="새 마인드맵 만들기"
        className="border-white/20 bg-[#171921]/95 text-white"
        side={deviceClass === 'desktop' ? 'right' : 'bottom'}
      >
        <div className="mx-auto h-1.5 w-14 rounded-full bg-white/18 md:hidden" />
        <SheetHeader className="space-y-3">
          <Badge className="w-fit bg-white/10 text-white">Create Map</Badge>
          <SheetTitle className="text-white">새 마인드맵을 바로 시작해요</SheetTitle>
          <SheetDescription className="text-white/65">
            제목만 정하면 기본 테마와 자동 저장이 준비된 캔버스로 바로 이동합니다.
          </SheetDescription>
        </SheetHeader>

        <label className="grid gap-2">
          <span className="text-sm font-medium text-white/78">제목</span>
          <Input
            autoFocus
            className="border-white/12 bg-white/8 text-white placeholder:text-white/35 focus-visible:ring-white/25"
            onChange={(event) => setTitle(event.target.value)}
            placeholder="예: 브랜드 캠페인 아이디어"
            value={title}
          />
        </label>

        <Card className="border-white/10 bg-white/6 text-white shadow-none">
          <CardContent className="grid gap-3 p-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <FolderPlus className="size-4 text-[#94b6ff]" />
              기본 설정
            </div>
            <p className="text-sm leading-6 text-white/65">
              단일 테마와 오프라인 자동 저장을 기본으로 사용합니다. 먼저 만들고,
              캔버스에서 바로 가지를 추가하세요.
            </p>
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/42">
              <Sparkles className="size-3.5" />
              Zero Friction Flow
            </div>
          </CardContent>
        </Card>

        <SheetFooter className="pt-1">
          <Button onClick={onClose} type="button" variant="outline">
            닫기
          </Button>
          <Button
            disabled={submitting}
            onClick={() => {
              void handleCreate()
            }}
            type="button"
          >
            {submitting ? '만드는 중...' : '마인드맵 만들기'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
