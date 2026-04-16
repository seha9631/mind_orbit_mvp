import { useEffect, useState } from 'react'

import type { DeviceClass } from '../shared/types/mindmap'

type Orientation = 'portrait' | 'landscape'

interface ResponsiveMode {
  deviceClass: DeviceClass
  keyboardInset: number
  orientation: Orientation
  isTouchPrimary: boolean
  keyboardVisible: boolean
  viewportWidth: number
  viewportHeight: number
}

function getDeviceClass(width: number): DeviceClass {
  if (width <= 767) {
    return 'mobile'
  }

  if (width <= 1023) {
    return 'tablet'
  }

  return 'desktop'
}

function getSnapshot(): ResponsiveMode {
  const viewport = window.visualViewport
  const viewportWidth = Math.round(viewport?.width ?? window.innerWidth)
  const viewportHeight = Math.round(viewport?.height ?? window.innerHeight)
  const orientation = viewportWidth > viewportHeight ? 'landscape' : 'portrait'
  const isTouchPrimary =
    window.matchMedia('(pointer: coarse)').matches ||
    navigator.maxTouchPoints > 0
  const keyboardInset =
    isTouchPrimary && viewport ? Math.max(0, Math.round(window.innerHeight - viewport.height)) : 0
  const keyboardVisible =
    isTouchPrimary &&
    keyboardInset > 140

  return {
    deviceClass: getDeviceClass(viewportWidth),
    keyboardInset,
    orientation,
    isTouchPrimary,
    keyboardVisible,
    viewportWidth,
    viewportHeight,
  }
}

export function useResponsiveMode() {
  const [mode, setMode] = useState<ResponsiveMode>(() => getSnapshot())

  useEffect(() => {
    const handleChange = () => {
      setMode(getSnapshot())
    }

    const viewport = window.visualViewport

    window.addEventListener('resize', handleChange)
    window.addEventListener('orientationchange', handleChange)
    viewport?.addEventListener('resize', handleChange)
    viewport?.addEventListener('scroll', handleChange)

    return () => {
      window.removeEventListener('resize', handleChange)
      window.removeEventListener('orientationchange', handleChange)
      viewport?.removeEventListener('resize', handleChange)
      viewport?.removeEventListener('scroll', handleChange)
    }
  }, [])

  return mode
}
