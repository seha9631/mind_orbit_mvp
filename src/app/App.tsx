import { startTransition, useEffect, useState } from 'react'

import { Badge } from '../shared/ui/badge'
import { Button } from '../shared/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../shared/ui/card'
import { getAppMeta, listMindMaps, saveAppMeta } from '../shared/lib/db'
import { useResponsiveMode } from './useResponsiveMode'
import { DashboardPage } from '../pages/dashboard/DashboardPage'
import { EditorPage } from '../pages/editor/EditorPage'
import { LandingPage } from '../pages/landing/LandingPage'

type Screen =
  | { name: 'landing' }
  | { name: 'dashboard' }
  | { name: 'editor'; mapId: string }

function App() {
  const responsiveMode = useResponsiveMode()
  const [screen, setScreen] = useState<Screen>({ name: 'landing' })
  const [bootState, setBootState] = useState<'loading' | 'ready' | 'error'>('loading')

  useEffect(() => {
    let cancelled = false

    async function hydrate() {
      try {
        const [meta, maps] = await Promise.all([getAppMeta(), listMindMaps()])
        const hasLastOpenedMap =
          !!meta?.lastOpenedMapId && maps.some((map) => map.id === meta.lastOpenedMapId)

        if (cancelled) {
          return
        }

        if (meta?.lastScreen === 'editor' && hasLastOpenedMap && meta.lastOpenedMapId) {
          setScreen({ name: 'editor', mapId: meta.lastOpenedMapId })
        } else if (maps.length > 0 || meta?.lastScreen === 'dashboard') {
          setScreen({ name: 'dashboard' })
        } else {
          setScreen({ name: 'landing' })
        }

        if (meta?.lastScreen === 'editor' && meta.lastOpenedMapId && !hasLastOpenedMap) {
          void saveAppMeta({
            lastOpenedMapId: undefined,
            lastScreen: maps.length > 0 ? 'dashboard' : 'landing',
          })
        }

        setBootState('ready')
      } catch {
        if (!cancelled) {
          setBootState('error')
        }
      }
    }

    void hydrate()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (bootState !== 'ready') {
      return
    }

    void saveAppMeta(
      screen.name === 'editor'
        ? {
            lastDeviceClass: responsiveMode.deviceClass,
            lastOpenedMapId: screen.mapId,
            lastScreen: 'editor',
          }
        : {
            lastDeviceClass: responsiveMode.deviceClass,
            lastScreen: screen.name,
          },
    )
  }, [bootState, responsiveMode.deviceClass, screen])

  function transitionTo(nextScreen: Screen) {
    startTransition(() => {
      setScreen(nextScreen)
    })
  }

  if (bootState === 'loading') {
    return (
      <div className="bg-orbit-shell flex min-h-dvh min-h-svh items-center justify-center p-5">
        <Card className="w-full max-w-md bg-white/76">
          <CardHeader className="items-center text-center">
            <Badge>Mind Orbit</Badge>
            <div className="h-16 w-16 animate-pulse rounded-full bg-gradient-to-br from-primary/80 via-[#97bcff] to-[#ef8d74]" />
            <CardTitle className="text-2xl">마인드맵을 준비하는 중이에요</CardTitle>
            <CardDescription>
              저장된 로컬 상태를 읽고 마지막 작업 흐름으로 복원하고 있어요.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (bootState === 'error') {
    return (
      <div className="bg-orbit-shell flex min-h-dvh min-h-svh items-center justify-center p-5">
        <Card className="w-full max-w-md bg-white/78">
          <CardHeader>
            <Badge variant="destructive">Storage Error</Badge>
            <CardTitle className="text-2xl">저장된 데이터를 읽지 못했어요</CardTitle>
            <CardDescription>
              브라우저 저장소 접근이 실패했어요. 새로고침하면 다시 연결을 시도합니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => window.location.reload()} type="button">
              다시 시도
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-dvh min-h-svh">
      {screen.name === 'landing' ? (
        <LandingPage
          deviceClass={responsiveMode.deviceClass}
          onStart={() => transitionTo({ name: 'dashboard' })}
        />
      ) : null}

      {screen.name === 'dashboard' ? (
        <DashboardPage
          deviceClass={responsiveMode.deviceClass}
          onOpenMap={(mapId) => transitionTo({ name: 'editor', mapId })}
        />
      ) : null}

      {screen.name === 'editor' ? (
        <EditorPage
          key={screen.mapId}
          deviceClass={responsiveMode.deviceClass}
          isTouchPrimary={responsiveMode.isTouchPrimary}
          keyboardInset={responsiveMode.keyboardInset}
          keyboardVisible={responsiveMode.keyboardVisible}
          mapId={screen.mapId}
          onGoHome={() => transitionTo({ name: 'dashboard' })}
        />
      ) : null}
    </div>
  )
}

export default App
