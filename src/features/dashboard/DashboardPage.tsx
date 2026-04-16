import { useState } from 'react'
import { ArrowUpRight, HardDriveDownload, Plus, Sparkles, Trash2 } from 'lucide-react'

import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../../components/ui/card'
import { cn } from '../../lib/utils'
import { useMindMapsIndex } from '../../hooks/useMindMapsIndex'
import type { DeviceClass } from '../../types/mindmap'
import { CreateMapSheet } from './CreateMapSheet'

interface DashboardPageProps {
  deviceClass: DeviceClass
  onOpenMap: (mapId: string) => void
}

function formatDateLabel(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function DashboardPage({ deviceClass, onOpenMap }: DashboardPageProps) {
  const { maps, loading, error, createMap, removeMap } = useMindMapsIndex()
  const [sheetOpen, setSheetOpen] = useState(false)

  async function handleCreate(title: string) {
    const map = await createMap(title)
    setSheetOpen(false)
    onOpenMap(map.id)
  }

  return (
    <main className="bg-dashboard-shell min-h-dvh min-h-svh px-5 py-6 text-white sm:px-8 lg:px-10">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header
          className={cn(
            'grid gap-5',
            deviceClass === 'mobile' ? '' : 'items-end md:grid-cols-[minmax(0,1fr)_auto]',
          )}
        >
          <div className="space-y-4">
            <Badge className="w-fit bg-white/12 text-white">Mind Orbit</Badge>
            <div className="space-y-3">
              <h1 className="max-w-[12ch] text-4xl font-semibold leading-[0.94] tracking-[-0.06em] text-balance sm:text-5xl lg:text-6xl">
                생각을 꺼내어 바로 이어가는 대시보드
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-white/70 sm:text-base">
                로컬에 저장된 마인드맵을 가볍게 열고, 새 생각은 하단 시트에서
                바로 시작하세요.
              </p>
            </div>
          </div>

          <Button className="h-12 px-6" onClick={() => setSheetOpen(true)} type="button">
            <Plus />
            새 마인드맵
          </Button>
        </header>

        <section
          className={cn(
            'grid gap-3',
            deviceClass === 'mobile'
              ? 'grid-cols-1'
              : deviceClass === 'tablet'
                ? 'grid-cols-3'
                : 'grid-cols-3',
          )}
        >
          <Card className="border-white/10 bg-white/6 text-white shadow-[0_20px_50px_rgba(0,0,0,0.22)]">
            <CardContent className="flex items-start justify-between p-5">
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-[0.2em] text-white/45">저장된 맵</p>
                <p className="text-2xl font-semibold">{maps.length}</p>
              </div>
              <HardDriveDownload className="size-5 text-white/65" />
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/6 text-white shadow-[0_20px_50px_rgba(0,0,0,0.22)]">
            <CardContent className="flex items-start justify-between p-5">
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-[0.2em] text-white/45">동작 방식</p>
                <p className="text-lg font-semibold">오프라인 자동 저장</p>
              </div>
              <Sparkles className="size-5 text-white/65" />
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/6 text-white shadow-[0_20px_50px_rgba(0,0,0,0.22)]">
            <CardContent className="flex items-start justify-between p-5">
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-[0.2em] text-white/45">우선순위</p>
                <p className="text-lg font-semibold">모바일 UX</p>
              </div>
              <ArrowUpRight className="size-5 text-white/65" />
            </CardContent>
          </Card>
        </section>

        {loading ? (
          <Card className="border-white/10 bg-white/6 text-white">
            <CardContent className="p-5 text-sm text-white/75">
              마인드맵을 불러오는 중이에요...
            </CardContent>
          </Card>
        ) : null}

        {error ? (
          <Card className="border-red-300/25 bg-red-400/8 text-white">
            <CardContent className="p-5 text-sm text-red-50/90">{error}</CardContent>
          </Card>
        ) : null}

        {!loading && maps.length === 0 ? (
          <Card className="border-white/10 bg-white/6 text-white">
            <CardHeader>
              <CardTitle>아직 저장된 맵이 없어요</CardTitle>
              <CardDescription className="text-white/62">
                새 생각은 하단 시트에서 가볍게 만들고, 곧바로 캔버스로 이동합니다.
              </CardDescription>
            </CardHeader>
            <CardFooter className="pt-0">
              <Button onClick={() => setSheetOpen(true)} type="button">
                첫 마인드맵 만들기
              </Button>
            </CardFooter>
          </Card>
        ) : null}

        <section
          className={cn(
            'grid gap-4',
            deviceClass === 'mobile'
              ? 'grid-cols-1'
              : deviceClass === 'tablet'
                ? 'grid-cols-2'
                : 'grid-cols-3',
          )}
        >
          {maps.map((map) => (
            <Card
              className="group cursor-pointer border-white/10 bg-white/7 text-white shadow-[0_22px_50px_rgba(0,0,0,0.22)] transition-transform duration-200 hover:-translate-y-1 hover:border-primary/40"
              key={map.id}
              onClick={() => onOpenMap(map.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  onOpenMap(map.id)
                }
              }}
              role="button"
              tabIndex={0}
            >
              <CardHeader className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <Badge className="bg-primary/18 text-primary-foreground">Offline</Badge>
                  <Button
                    className="bg-red-500/12 text-red-50 hover:bg-red-500/22"
                    onClick={(event) => {
                      event.stopPropagation()

                      if (window.confirm('이 마인드맵을 삭제할까요?')) {
                        void removeMap(map.id)
                      }
                    }}
                    size="icon"
                    type="button"
                    variant="ghost"
                  >
                    <Trash2 />
                  </Button>
                </div>

                <div className="space-y-2">
                  <CardTitle className="text-2xl text-white">{map.title}</CardTitle>
                  <CardDescription className="text-white/62">
                    {map.nodes.length}개의 노드 · {formatDateLabel(map.updatedAt)}
                  </CardDescription>
                </div>
              </CardHeader>

              <CardContent className="grid gap-3 pt-0">
                <div className="grid gap-2">
                  <div className="h-2 rounded-full bg-white/8">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-primary via-[#94b6ff] to-[#ef8d74]"
                      style={{
                        width: `${Math.max(32, Math.min(100, map.nodes.length * 14))}%`,
                      }}
                    />
                  </div>
                  <p className="text-sm leading-6 text-white/62">
                    마지막 작업 상태가 이 기기 안에 저장되어 있어요.
                  </p>
                </div>
              </CardContent>

              <CardFooter className="items-center justify-between pt-0 text-sm text-white/55">
                <span>열어서 이어쓰기</span>
                <ArrowUpRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </CardFooter>
            </Card>
          ))}
        </section>
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
