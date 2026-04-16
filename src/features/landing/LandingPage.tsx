import { ArrowRight, CloudOff, MoveUpRight, Smartphone } from 'lucide-react'

import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Card, CardContent } from '../../components/ui/card'
import { cn } from '../../lib/utils'
import type { DeviceClass } from '../../types/mindmap'

interface LandingPageProps {
  deviceClass: DeviceClass
  onStart: () => void
}

export function LandingPage({ deviceClass, onStart }: LandingPageProps) {
  const compactVisual = deviceClass === 'mobile'

  return (
    <main
      className={cn(
        'bg-orbit-shell relative min-h-dvh min-h-svh overflow-hidden px-5 py-6',
        deviceClass === 'desktop'
          ? 'grid grid-cols-[minmax(0,1.05fr)_minmax(22rem,0.95fr)] items-center gap-10 px-10 py-10'
          : 'grid content-center gap-8 sm:px-8 sm:py-8',
      )}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-8%] top-[-5%] h-48 w-48 rounded-full bg-primary/15 blur-3xl sm:h-72 sm:w-72" />
        <div className="absolute bottom-[-12%] right-[-4%] h-56 w-56 rounded-full bg-[#ef8d74]/20 blur-3xl sm:h-80 sm:w-80" />
      </div>

      <section className="relative z-10 flex max-w-2xl flex-col gap-6">
        <Badge className="w-fit">Mind Orbit</Badge>
        <div className="space-y-4">
          <h1 className="max-w-[12ch] text-5xl font-semibold leading-[0.92] tracking-[-0.06em] text-balance sm:text-6xl lg:text-7xl">
            생각이 가장 가볍게 펼쳐지는 모바일 마인드맵
          </h1>
          <p className="max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
            서버 연결 없이도 마지막 생각을 바로 이어갈 수 있는 오프라인 중심
            캔버스를 준비했어요. 먼저 모바일에서 부드럽고 아름답게, 그리고
            태블릿과 데스크톱에서도 같은 흐름으로 이어집니다.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button className="h-12 px-6 text-sm" onClick={onStart} type="button">
            시작하기
            <ArrowRight />
          </Button>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CloudOff className="size-4" />
            <span>오프라인 자동 저장 · 모바일 우선 검증</span>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Card className="border-white/60 bg-white/70">
            <CardContent className="space-y-2 p-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <CloudOff className="size-4 text-primary" />
                Zero Friction
              </div>
              <p className="text-sm leading-6 text-muted-foreground">
                저장 버튼 없이 바로 쓰고, 바로 복구되는 흐름을 기본값으로 둡니다.
              </p>
            </CardContent>
          </Card>

          <Card className="border-white/60 bg-white/70">
            <CardContent className="space-y-2 p-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Smartphone className="size-4 text-primary" />
                Mobile First
              </div>
              <p className="text-sm leading-6 text-muted-foreground">
                터치 조작과 키보드 열림까지 모바일 화면 기준으로 먼저 다듬습니다.
              </p>
            </CardContent>
          </Card>

          <Card className="border-white/60 bg-white/70">
            <CardContent className="space-y-2 p-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <MoveUpRight className="size-4 text-primary" />
                Same Canvas
              </div>
              <p className="text-sm leading-6 text-muted-foreground">
                태블릿과 데스크톱에서도 같은 캔버스를 밀도만 바꿔 자연스럽게 씁니다.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="relative z-10 flex items-center justify-center lg:justify-end">
        <Card className="relative w-full max-w-xl overflow-hidden rounded-[36px] border-white/60 bg-white/72">
          <CardContent
            className={cn(
              'relative min-h-[22rem] p-6 sm:min-h-[28rem] sm:p-8',
              compactVisual ? 'min-h-[20rem]' : '',
            )}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(93,103,255,0.12),transparent_36%),radial-gradient(circle_at_bottom_right,_rgba(239,141,116,0.16),transparent_38%)]" />
            <div className="relative flex h-full flex-col justify-between">
              <div className="space-y-2">
                <Badge variant="outline" className="bg-white/70">
                  Aesthetic Flow
                </Badge>
                <p className="max-w-xs text-sm leading-6 text-muted-foreground">
                  캔버스는 비워 두고, 생각은 중앙에서 바깥으로 가볍게 퍼지도록
                  설계했습니다.
                </p>
              </div>

              <div className="relative mx-auto flex h-full min-h-[14rem] w-full items-center justify-center">
                <div className="absolute left-[10%] top-[22%] h-24 w-24 rounded-full border border-dashed border-primary/25" />
                <div className="absolute right-[10%] top-[14%] h-28 w-28 rounded-full border border-dashed border-[#ef8d74]/30" />
                <div className="absolute bottom-[8%] left-[18%] h-20 w-20 rounded-full border border-dashed border-[#80c3aa]/35" />

                <div className="absolute left-[22%] top-[35%] h-px w-[24%] bg-gradient-to-r from-primary/0 via-primary/45 to-primary/0" />
                <div className="absolute right-[22%] top-[35%] h-px w-[24%] bg-gradient-to-r from-[#ef8d74]/0 via-[#ef8d74]/45 to-[#ef8d74]/0" />
                <div className="absolute bottom-[22%] left-[36%] h-[22%] w-px bg-gradient-to-b from-[#7ac0ab]/0 via-[#7ac0ab]/50 to-[#7ac0ab]/0" />

                <div className="absolute left-[12%] top-[28%] rounded-full border border-white/70 bg-white/88 px-3 py-2 text-xs font-medium shadow-sm">
                  아이디어 확장
                </div>
                <div className="absolute right-[8%] top-[22%] rounded-full border border-white/70 bg-white/88 px-3 py-2 text-xs font-medium shadow-sm">
                  모바일 작성
                </div>
                <div className="absolute bottom-[10%] left-[28%] rounded-full border border-white/70 bg-white/88 px-3 py-2 text-xs font-medium shadow-sm">
                  오프라인 복구
                </div>

                <div className="rounded-[26px] border border-primary/20 bg-white px-5 py-3 text-sm font-semibold shadow-[0_18px_40px_rgba(93,103,255,0.16)]">
                  나의 새 마인드맵
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
