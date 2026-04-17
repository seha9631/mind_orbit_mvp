import { startTransition, useEffect, useState } from 'react'

import { Badge } from '../shared/ui/badge'
import { Button } from '../shared/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../shared/ui/card'
import { getAppMeta, listMindMaps, saveAppMeta } from '../shared/lib/db'
import { DashboardPage } from '../pages/dashboard/DashboardPage'
import { EditorPage } from '../pages/editor/EditorPage'
import { LandingPage } from '../pages/landing/LandingPage'
import { AppErrorBoundary } from './AppErrorBoundary'
import { useResponsiveMode } from './useResponsiveMode'

type Screen =
  | { name: 'landing' }
  | { name: 'dashboard' }
  | { name: 'editor'; mapId: string }

type AppStatus = 'loading' | 'ready' | 'error'

function LoadingScreen() {
  return (
    <div className="bg-orbit-shell app-screen safe-page-x safe-page-y flex items-center justify-center">
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

function ErrorScreen() {
  return (
    <div className="bg-orbit-shell app-screen safe-page-x safe-page-y flex items-center justify-center">
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

function App() {
  const mode = useResponsiveMode()
  const [screen, setScreen] = useState<Screen>({ name: 'landing' })
  const [status, setStatus] = useState<AppStatus>('loading')

  useEffect(() => {
    let cancelled = false

    async function hydrateApp() {
      try {
        const [meta, maps] = await Promise.all([getAppMeta(), listMindMaps()])

        if (cancelled) {
          return
        }

        const hasLastOpenedMap =
          !!meta?.lastOpenedMapId &&
          maps.some((map) => map.id === meta.lastOpenedMapId)

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

        setStatus('ready')
      } catch {
        if (!cancelled) {
          setStatus('error')
        }
      }
    }

    void hydrateApp()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (status !== 'ready') {
      return
    }

    const meta =
      screen.name === 'editor'
        ? {
            lastDeviceClass: mode.deviceClass,
            lastOpenedMapId: screen.mapId,
            lastScreen: 'editor' as const,
          }
        : {
            lastDeviceClass: mode.deviceClass,
            lastScreen: screen.name,
          }

    void saveAppMeta(meta)
  }, [mode.deviceClass, screen, status])

  function transitionTo(nextScreen: Screen) {
    startTransition(() => {
      setScreen(nextScreen)
    })
  }

  if (status === 'loading') {
    return <LoadingScreen />
  }

  if (status === 'error') {
    return <ErrorScreen />
  }

  return (
    <AppErrorBoundary>
      <div className="app-screen">
        {screen.name === 'landing' ? (
          <LandingPage
            deviceClass={mode.deviceClass}
            onStart={() => transitionTo({ name: 'dashboard' })}
          />
        ) : null}

        {screen.name === 'dashboard' ? (
          <DashboardPage
            deviceClass={mode.deviceClass}
            onOpenMap={(mapId) => transitionTo({ name: 'editor', mapId })}
          />
        ) : null}

        {screen.name === 'editor' ? (
          <EditorPage
            deviceClass={mode.deviceClass}
            isTouchPrimary={mode.isTouchPrimary}
            keyboardInset={mode.keyboardInset}
            keyboardVisible={mode.keyboardVisible}
            key={screen.mapId}
            mapId={screen.mapId}
            onGoHome={() => transitionTo({ name: 'dashboard' })}
          />
        ) : null}
      </div>
    </AppErrorBoundary>
  )
}

export default App
