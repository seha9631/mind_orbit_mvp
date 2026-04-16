import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'

import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { cn } from '../../lib/utils'
import { useMindMapsIndex } from '../../hooks/useMindMapsIndex'
import type { DeviceClass, MindMapRecord } from '../../types/mindmap'
import { CreateMapSheet } from './CreateMapSheet'

interface DashboardPageProps {
  deviceClass: DeviceClass
  onOpenMap: (mapId: string) => void
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const GRID_COLS: Record<DeviceClass, string> = {
  mobile: 'grid-cols-1',
  tablet: 'grid-cols-2',
  desktop: 'grid-cols-3',
}

function formatDateLabel(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

// ── MapCard ───────────────────────────────────────────────────────────────────

interface MapCardProps {
  map: MindMapRecord
  alwaysShowDelete: boolean
  onOpen: () => void
  onDelete: () => void
}

function MapCard({ map, alwaysShowDelete, onOpen, onDelete }: MapCardProps) {
  return (
    <Card
      className="group relative cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_24px_64px_rgba(17,24,39,0.12)]"
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onOpen()
        }
      }}
      role="button"
      tabIndex={0}
    >
      <CardHeader className="pb-2 pr-10">
        <CardTitle className="text-base font-semibold leading-snug">{map.title}</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-between pt-0">
        <p className="text-xs text-muted-foreground">
          {formatDateLabel(map.updatedAt)} 마지막 수정
        </p>
        <p className="text-xs text-muted-foreground/60">{map.nodes.length}개 노드</p>
      </CardContent>
      <Button
        className={cn(
          'absolute right-3 top-3 size-8 text-muted-foreground/60 transition-all duration-200 hover:bg-destructive/8 hover:text-destructive',
          !alwaysShowDelete && 'opacity-0 group-hover:opacity-100',
        )}
        onClick={(event) => {
          event.stopPropagation()
          if (window.confirm('이 마인드맵을 삭제할까요?')) {
            onDelete()
          }
        }}
        size="icon"
        type="button"
        variant="ghost"
      >
        <Trash2 className="size-3.5" />
      </Button>
    </Card>
  )
}

// ── DashboardPage ─────────────────────────────────────────────────────────────

export function DashboardPage({ deviceClass, onOpenMap }: DashboardPageProps) {
  const { maps, loading, error, createMap, removeMap } = useMindMapsIndex()
  const [sheetOpen, setSheetOpen] = useState(false)

  async function handleCreate(title: string) {
    const map = await createMap(title)
    setSheetOpen(false)
    onOpenMap(map.id)
  }

  return (
    <main className="bg-editor-shell min-h-dvh min-h-svh px-5 py-6 sm:px-8 lg:px-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <header className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Mind Orbit
            </span>
            {!loading ? (
              <span className="text-xs text-muted-foreground/60">
                {maps.length} universes created
              </span>
            ) : null}
          </div>
          <Button className="h-10 gap-1.5 px-5" onClick={() => setSheetOpen(true)} type="button">
            <Plus className="size-4" />
            새 마인드맵
          </Button>
        </header>

        {error ? (
          <Card className="border-destructive/20 bg-destructive/5 shadow-none">
            <CardContent className="p-4 text-sm text-destructive">{error}</CardContent>
          </Card>
        ) : null}

        {loading ? (
          <div className="py-16 text-center text-sm text-muted-foreground">불러오는 중...</div>
        ) : null}

        {!loading && maps.length === 0 ? (
          <div className="flex flex-col items-center gap-5 py-24 text-center">
            <p className="text-sm text-muted-foreground">아직 만든 마인드맵이 없어요</p>
            <Button onClick={() => setSheetOpen(true)} type="button">
              <Plus className="size-4" />
              첫 마인드맵 만들기
            </Button>
          </div>
        ) : null}

        {!loading && maps.length > 0 ? (
          <section className={cn('grid gap-3', GRID_COLS[deviceClass])}>
            {maps.map((map) => (
              <MapCard
                alwaysShowDelete={deviceClass === 'mobile'}
                key={map.id}
                map={map}
                onDelete={() => void removeMap(map.id)}
                onOpen={() => onOpenMap(map.id)}
              />
            ))}
          </section>
        ) : null}
      </div>

      <CreateMapSheet
        deviceClass={deviceClass}
        onClose={() => setSheetOpen(false)}
        onCreate={handleCreate}
        open={sheetOpen}
      />
    </main>
  )
}
