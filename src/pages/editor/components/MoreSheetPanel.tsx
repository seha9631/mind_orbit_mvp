import { GitBranchPlus, PencilLine, Plus, Trash2 } from 'lucide-react'

import { Button } from '../../../shared/ui/button'
import { Card, CardContent } from '../../../shared/ui/card'
import type { DeviceClass, MindMapRecord } from '../../../shared/types/mindmap'
import { BaseEditorSheet } from './BaseEditorSheet'

interface MoreSheetPanelProps {
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

export function MoreSheetPanel({
  canDelete,
  canAddSibling,
  deviceClass,
  map,
  onAddChild,
  onAddSibling,
  onClose,
  onDelete,
  onStartEditing,
}: MoreSheetPanelProps) {
  return (
    <BaseEditorSheet
      ariaLabel="더보기 시트"
      badgeLabel="More"
      description="모바일과 데스크톱 모두 같은 작업 흐름을 유지합니다."
      deviceClass={deviceClass}
      onClose={onClose}
      title="선택한 노드 작업"
    >
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
    </BaseEditorSheet>
  )
}