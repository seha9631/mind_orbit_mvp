import { GitBranchPlus, PencilLine, Plus, Trash2 } from 'lucide-react'

import { Badge } from '../../../shared/ui/badge'
import { Button } from '../../../shared/ui/button'
import { Card, CardContent } from '../../../shared/ui/card'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '../../../shared/ui/sheet'
import type { ActiveSheet, DeviceClass, MindMapRecord } from '../../../shared/types/mindmap'

interface EditorBottomSheetProps {
  activeSheet: ActiveSheet
  canDelete: boolean
  canAddSibling: boolean
  deviceClass: DeviceClass
  map: MindMapRecord
  onAddChild: () => void
  onAddSibling: () => void
  onClose: () => void
  onDelete: () => void
  onStartEditing: () => void
}

export function EditorBottomSheet({
  activeSheet,
  canAddSibling,
  canDelete,
  deviceClass,
  map,
  onAddChild,
  onAddSibling,
  onClose,
  onDelete,
  onStartEditing,
}: EditorBottomSheetProps) {
  if (activeSheet === 'none' || activeSheet === 'create-map') {
    return null
  }

  const isStyleSheet = activeSheet === 'style'

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
        aria-label={isStyleSheet ? '스타일 시트' : '더보기 시트'}
        className="border-white/20 bg-[#171921]/95 text-white"
        side={deviceClass === 'desktop' ? 'right' : 'bottom'}
      >
        <div className="mx-auto h-1.5 w-14 rounded-full bg-white/18 md:hidden" />
        <SheetHeader className="space-y-3">
          <Badge className="w-fit bg-white/10 text-white">{isStyleSheet ? 'Style' : 'More'}</Badge>
          <SheetTitle className="text-white">
            {isStyleSheet ? '현재 스타일과 보기 밀도' : '선택한 노드 작업'}
          </SheetTitle>
          <SheetDescription className="text-white/65">
            {isStyleSheet
              ? '현재 MVP는 단일 테마를 유지하고, 기기별로 밀도만 조정합니다.'
              : '모바일과 데스크톱 모두 같은 작업 흐름을 유지합니다.'}
          </SheetDescription>
        </SheetHeader>

        {isStyleSheet ? (
          <div className="grid gap-4">
            <Card className="border-white/10 bg-white/6 text-white shadow-none">
              <CardContent className="grid gap-2 p-4">
                <strong className="text-sm font-semibold">Orbit Flow</strong>
                <p className="text-sm leading-6 text-white/65">
                Sprint 6에서는 단일 테마를 유지합니다. 대신 모든 기기에서 같은
                시각 문법과 노드 밀도를 반응형으로 맞춥니다.
                </p>
              </CardContent>
            </Card>
            <div className="flex flex-wrap gap-3">
              <div className="size-10 rounded-full bg-[#ef8d74]" />
              <div className="size-10 rounded-full bg-[#f5b48d]" />
              <div className="size-10 rounded-full bg-[#7cb7c7]" />
              <div className="size-10 rounded-full bg-[#4c6f89]" />
              <div className="size-10 rounded-full bg-[#89b6ff]" />
            </div>
            <p className="text-sm leading-6 text-white/65">
              모바일에서는 더 넓게, 데스크톱에서는 더 촘촘하게 보이지만 기능은
              기기별로 달라지지 않아요.
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            <Button
              className="h-12 justify-between rounded-2xl border-white/10 bg-white/6 text-white shadow-none hover:bg-white/10"
              onClick={onStartEditing}
              type="button"
              variant="outline"
            >
              텍스트 편집
              <PencilLine />
            </Button>
            <Button
              className="h-12 justify-between rounded-2xl border-white/10 bg-white/6 text-white shadow-none hover:bg-white/10"
              onClick={onAddChild}
              type="button"
              variant="outline"
            >
              자식 노드 추가
              <Plus />
            </Button>
            <Button
              className="h-12 justify-between rounded-2xl border-white/10 bg-white/6 text-white shadow-none hover:bg-white/10"
              disabled={!canAddSibling}
              onClick={onAddSibling}
              type="button"
              variant="outline"
            >
              형제 노드 추가
              <GitBranchPlus />
            </Button>
            <Button
              className="h-12 justify-between rounded-2xl border-red-300/20 bg-red-400/8 text-red-50 shadow-none hover:bg-red-400/14"
              disabled={!canDelete}
              onClick={onDelete}
              type="button"
              variant="outline"
            >
              노드 삭제
              <Trash2 />
            </Button>
            <Card className="border-white/10 bg-white/6 text-white shadow-none">
              <CardContent className="grid gap-1 p-4">
                <strong className="text-sm font-semibold">{map.title}</strong>
                <p className="text-sm leading-6 text-white/65">
                  {map.nodes.length}개 노드가 오프라인으로 저장됩니다.
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
