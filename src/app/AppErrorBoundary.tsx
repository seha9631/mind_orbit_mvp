import { Component, type ErrorInfo, type ReactNode } from 'react'

import { Badge } from '../shared/ui/badge'
import { Button } from '../shared/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../shared/ui/card'
import { saveAppMeta } from '../shared/lib/db'

interface AppErrorBoundaryProps {
  children: ReactNode
}

interface AppErrorBoundaryState {
  hasError: boolean
}

export class AppErrorBoundary extends Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  override state: AppErrorBoundaryState = {
    hasError: false,
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    void error
    void info
  }

  private handleRecoverToDashboard() {
    void saveAppMeta({
      lastOpenedMapId: undefined,
      lastScreen: 'dashboard',
    }).finally(() => {
      window.location.reload()
    })
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div className="bg-orbit-shell flex min-h-dvh min-h-svh items-center justify-center p-5">
          <Card className="w-full max-w-xl bg-white/78">
            <CardHeader>
              <Badge>Mind Orbit</Badge>
              <CardTitle className="text-3xl">화면을 다시 정리하는 중이에요</CardTitle>
              <CardDescription>
                예기치 못한 오류가 발생했어요. 새로고침하면 마지막으로 저장된
                상태로 돌아갈 수 있어요.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button
                onClick={() => this.handleRecoverToDashboard()}
                type="button"
                variant="outline"
              >
                대시보드로 이동
              </Button>
              <Button onClick={() => window.location.reload()} type="button">
                새로고침
              </Button>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}
