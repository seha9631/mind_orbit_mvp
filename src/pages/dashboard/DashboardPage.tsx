import { useState } from 'react'
import { Plus, Star, Trash2 } from 'lucide-react'

import { Button } from '../../shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../shared/ui/card'
import { cn } from '../../shared/lib/utils'
import { useMindMapsIndex } from './useMindMapsIndex'
import type { DeviceClass, MindMapRecord } from '../../shared/types/mindmap'
import { DeleteConfirmDialog } from './DeleteConfirmDialog'

// ── Types ─────────────────────────────────────────────────────────────────────

type Filter = 'all' | 'favorites'

interface PendingDelete {
  id: string
  title: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const GRID_COLS: Record<DeviceClass, string> = {
  mobile: 'grid-cols-1',
  tablet: 'grid-cols-2',
  desktop: 'grid-cols-3',
}

const TAB_LABELS: Record<Filter, string> = {
  all: 'All',
  favorites: 'Favorites',
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
  onToggleFavorite: () => void
}

function MapCard({ map, alwaysShowDelete, onOpen, onDelete, onToggleFavorite }: MapCardProps) {
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
      <CardHeader className="pb-2 pr-20">
        <CardTitle className="text-base font-semibold leading-snug">{map.title}</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-between pt-0">
        <p className="text-xs text-muted-foreground">
          {formatDateLabel(map.updatedAt)} 마지막 수정
        </p>
        <p className="text-xs text-muted-foreground/60">{map.nodes.length}개 노드</p>
      </CardContent>

      {/* Favorite toggle */}
      <Button
        className={cn(
          'absolute right-11 top-3 size-8 transition-all duration-150',
          map.isFavorite
            ? 'text-amber-400 hover:text-amber-500'
            : 'text-muted-foreground/35 hover:text-amber-400',
        )}
        onClick={(event) => {
          event.stopPropagation()
          onToggleFavorite()
        }}
        size="icon"
        type="button"
        variant="ghost"
      >
        <Star className={cn('size-3.5', map.isFavorite && 'fill-amber-400')} />
      </Button>

      {/* Delete */}
      <Button
        className={cn(
          'absolute right-3 top-3 size-8 text-muted-foreground/60 transition-all duration-200 hover:bg-destructive/8 hover:text-destructive',
          !alwaysShowDelete && 'opacity-0 group-hover:opacity-100',
        )}
        onClick={(event) => {
          event.stopPropagation()
          onDelete()
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

interface DashboardPageProps {
  deviceClass: DeviceClass
  onOpenMap: (mapId: string) => void
}

export function DashboardPage({ deviceClass, onOpenMap }: DashboardPageProps) {
  const { maps, loading, error, createMap, removeMap, toggleFavorite } = useMindMapsIndex()
  const [filter, setFilter] = useState<Filter>('all')
  const [creating, setCreating] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null)

  const filteredMaps = filter === 'favorites' ? maps.filter((m) => m.isFavorite) : maps

  async function handleCreate() {
    if (creating) return
    try {
      setCreating(true)
      const map = await createMap('')
      onOpenMap(map.id)
    } finally {
      setCreating(false)
    }
  }

  function handleDeleteConfirm() {
    if (!pendingDelete) return
    void removeMap(pendingDelete.id)
    setPendingDelete(null)
  }

  return (
    <main className="bg-editor-shell min-h-dvh min-h-svh px-5 py-6 sm:px-8 lg:px-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        {/* Header */}
        <header className="flex flex-col gap-3">
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

          {/* Filter tabs */}
          <div className="flex border-b border-border/40">
            {(['all', 'favorites'] as const).map((tab) => (
              <button
                className={cn(
                  'mr-4 pb-2 text-sm font-medium transition-colors duration-150',
                  filter === tab
                    ? '-mb-px border-b-2 border-primary text-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
                key={tab}
                onClick={() => setFilter(tab)}
                type="button"
              >
                {TAB_LABELS[tab]}
              </button>
            ))}
          </div>
        </header>

        {error ? (
          <Card className="border-destructive/20 bg-destructive/5 shadow-none">
            <CardContent className="p-4 text-sm text-destructive">{error}</CardContent>
          </Card>
        ) : null}

        {loading ? (
          <div className="py-16 text-center text-sm text-muted-foreground">불러오는 중...</div>
        ) : null}

        {/* Empty: no maps at all */}
        {!loading && maps.length === 0 ? (
          <div className="py-24 text-center text-sm text-muted-foreground">
            아직 만든 마인드맵이 없어요
          </div>
        ) : null}

        {/* Empty: favorites tab but none starred */}
        {!loading && maps.length > 0 && filteredMaps.length === 0 ? (
          <div className="py-24 text-center text-sm text-muted-foreground">
            즐겨찾기한 마인드맵이 없어요
          </div>
        ) : null}

        {/* Map grid */}
        {!loading && filteredMaps.length > 0 ? (
          <section className={cn('grid gap-3', GRID_COLS[deviceClass])}>
            {filteredMaps.map((map) => (
              <MapCard
                alwaysShowDelete={deviceClass === 'mobile'}
                key={map.id}
                map={map}
                onDelete={() => setPendingDelete({ id: map.id, title: map.title })}
                onOpen={() => onOpenMap(map.id)}
                onToggleFavorite={() => void toggleFavorite(map.id)}
              />
            ))}
          </section>
        ) : null}
      </div>

      {/* FAB — new map */}
      <button
        className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_18px_40px_rgba(92,112,255,0.3)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary/90 disabled:opacity-60"
        disabled={creating}
        onClick={() => void handleCreate()}
        type="button"
      >
        <Plus className="size-6" />
      </button>

      {/* Delete confirmation dialog */}
      {pendingDelete ? (
        <DeleteConfirmDialog
          itemName={pendingDelete.title}
          onCancel={() => setPendingDelete(null)}
          onConfirm={handleDeleteConfirm}
        />
      ) : null}
    </main>
  )
}
