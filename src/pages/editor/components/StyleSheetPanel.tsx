import { Card, CardContent } from '../../../shared/ui/card'
import type { DeviceClass } from '../../../shared/types/mindmap'
import { BaseEditorSheet } from './BaseEditorSheet'

interface StyleSheetPanelProps {
  deviceClass: DeviceClass
  onClose: () => void
}

export function StyleSheetPanel({
  deviceClass,
  onClose,
}: StyleSheetPanelProps) {
  return (
    <BaseEditorSheet
      ariaLabel="스타일 시트"
      badgeLabel="Style"
      description="현재 MVP는 단일 테마를 유지하고, 기기별로 밀도만 조정합니다."
      deviceClass={deviceClass}
      onClose={onClose}
      title="현재 스타일과 보기 밀도"
    >
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
    </BaseEditorSheet>
  )
}