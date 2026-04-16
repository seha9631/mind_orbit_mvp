import { Button } from '../../components/ui/button'

interface DeleteConfirmDialogProps {
  itemName: string
  onConfirm: () => void
  onCancel: () => void
}

export function DeleteConfirmDialog({ itemName, onConfirm, onCancel }: DeleteConfirmDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-6" onClick={onCancel}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />

      {/* Dialog */}
      <div
        className="relative w-full max-w-xs rounded-2xl bg-white p-6 shadow-[0_32px_64px_rgba(17,24,39,0.22)]"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-center text-base font-semibold text-foreground">삭제하시겠습니까?</p>
        <p className="mt-2 text-center text-sm leading-6 text-muted-foreground">
          {itemName}를 삭제하면 복구할 수 없습니다
        </p>
        <div className="mt-5 flex gap-3">
          <Button className="flex-1" onClick={onCancel} type="button" variant="outline">
            취소
          </Button>
          <Button
            className="flex-1 bg-foreground text-background hover:bg-foreground/90"
            onClick={onConfirm}
            type="button"
          >
            삭제
          </Button>
        </div>
      </div>
    </div>
  )
}
