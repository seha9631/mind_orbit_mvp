import { useEffect, useRef, type CSSProperties } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { MoreHorizontal, Plus } from 'lucide-react'
import { flushSync } from 'react-dom'

import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { cn } from '../../lib/utils'
import type { MindFlowNode } from './mindNodeTypes'

function withAlpha(hex: string, alpha: number) {
  const normalized = hex.replace('#', '')
  const expanded =
    normalized.length === 3
      ? normalized
          .split('')
          .map((character) => `${character}${character}`)
          .join('')
      : normalized

  const red = Number.parseInt(expanded.slice(0, 2), 16)
  const green = Number.parseInt(expanded.slice(2, 4), 16)
  const blue = Number.parseInt(expanded.slice(4, 6), 16)

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`
}

function getWidthClass(
  deviceClass: MindFlowNode['data']['deviceClass'],
  isCompact: boolean,
) {
  switch (deviceClass) {
    case 'desktop':
      return isCompact
        ? 'min-h-10 w-[clamp(8.75rem,12vw,11rem)]'
        : 'min-h-10 w-[clamp(13.75rem,18vw,17.5rem)]'
    case 'tablet':
      return isCompact
        ? 'min-h-11 w-[clamp(8.5rem,28vw,10.5rem)]'
        : 'min-h-11 w-[clamp(10rem,34vw,13.75rem)]'
    case 'mobile':
      return isCompact
        ? 'min-h-11 w-[clamp(8.5rem,28vw,10.5rem)]'
        : 'min-h-11 w-[clamp(10rem,34vw,13.75rem)]'
  }
}

export function MindMapNode({ data, selected }: NodeProps<MindFlowNode>) {
  const longPressRef = useRef<number | null>(null)
  const longPressTriggeredRef = useRef(false)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null)

  function clearLongPress() {
    if (longPressRef.current) {
      window.clearTimeout(longPressRef.current)
      longPressRef.current = null
    }
  }

  function handleGestureStart(clientX: number, clientY: number) {
    pointerStartRef.current = {
      x: clientX,
      y: clientY,
    }
    longPressTriggeredRef.current = false
  }

  function handleGestureEnd(clientX: number, clientY: number) {
    const pointerStart = pointerStartRef.current
    pointerStartRef.current = null

    if (!pointerStart || longPressTriggeredRef.current) {
      longPressTriggeredRef.current = false
      return
    }

    const deltaX = clientX - pointerStart.x
    const deltaY = clientY - pointerStart.y
    const movedDistance = Math.hypot(deltaX, deltaY)

    if (movedDistance < 8) {
      startEditingFromGesture()
    }
  }

  useEffect(() => {
    if (!data.isEditing) {
      return
    }

    const input = inputRef.current

    if (!input) {
      return
    }

    const focusInput = () => {
      input.focus({ preventScroll: true })
      const cursorPosition = input.value.length
      input.setSelectionRange(cursorPosition, cursorPosition)
    }

    focusInput()

    const timerId = window.setTimeout(focusInput, 40)

    return () => {
      window.clearTimeout(timerId)
    }
  }, [data.isEditing])

  function startEditingFromGesture() {
    flushSync(() => {
      data.onStartEditing(data.id)
    })

    const input = inputRef.current

    if (!input) {
      return
    }

    input.focus({ preventScroll: true })
    const cursorPosition = input.value.length
    input.setSelectionRange(cursorPosition, cursorPosition)
  }

  const showPlaceholder = !data.label.trim()
  const widthClass = getWidthClass(data.deviceClass, showPlaceholder)
  const surfaceStyle: CSSProperties = {
    borderColor: selected ? withAlpha(data.color, 0.42) : withAlpha(data.color, data.isRoot ? 0.18 : 0.1),
    boxShadow: selected
      ? `0 20px 44px rgba(17, 24, 39, 0.1), 0 0 0 4px ${withAlpha(data.color, 0.18)}`
      : `0 18px 36px rgba(17, 24, 39, 0.08)`,
  }

  return (
    <div
      className={cn(
        'relative min-w-28',
        selected ? 'z-[3]' : 'z-[2]',
      )}
      onContextMenu={(event) => {
        event.preventDefault()
        data.onSelect(data.id)
        data.onOpenMore(data.id)
      }}
      onTouchEnd={clearLongPress}
      onTouchMove={clearLongPress}
      onTouchStart={() => {
        clearLongPress()

        if (!data.touchPrimary) {
          return
        }

        longPressRef.current = window.setTimeout(() => {
          longPressTriggeredRef.current = true
          data.onSelect(data.id)
          data.onOpenMore(data.id)
        }, 420)
      }}
      style={{
        ['--node-color' as string]: data.color,
      }}
    >
      <Handle
        className="!size-2.5 !border-0 !bg-transparent"
        id="left-target"
        position={Position.Left}
        style={{ opacity: data.isRoot ? 0 : 0.001 }}
        type="target"
      />
      <Handle
        className="!size-2.5 !border-0 !bg-transparent"
        id="left-source"
        position={Position.Left}
        style={{ opacity: data.isRoot ? 0 : 0.001 }}
        type="source"
      />

      <div className="relative">
        {data.isEditing ? (
          <Input
            autoFocus
            className={cn(
              'nodrag nopan rounded-[20px] bg-white/95 px-4 py-3 text-sm shadow-[0_18px_36px_rgba(17,24,39,0.08)]',
              widthClass,
              data.isRoot ? 'font-semibold' : '',
            )}
            inputMode="text"
            onBlur={data.onStopEditing}
            onChange={(event) => data.onChangeLabel(data.id, event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === 'Escape') {
                event.preventDefault()
                data.onStopEditing()
              }
            }}
            placeholder={data.placeholder}
            ref={inputRef}
            style={surfaceStyle}
            value={data.label}
          />
        ) : (
          <Card
            className={cn(
              'cursor-grab rounded-[22px] bg-white/94 px-4 py-3 transition-all duration-150 active:cursor-grabbing',
              widthClass,
              data.isRoot ? 'bg-white/86 font-semibold' : '',
            )}
            onPointerDown={(event) => {
              if (event.button !== 0) {
                return
              }

              handleGestureStart(event.clientX, event.clientY)
            }}
            onPointerUp={(event) => {
              handleGestureEnd(event.clientX, event.clientY)
            }}
            onPointerCancel={() => {
              pointerStartRef.current = null
              longPressTriggeredRef.current = false
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                startEditingFromGesture()
              }
            }}
            role="button"
            style={surfaceStyle}
            tabIndex={0}
          >
            <span
              className={cn(
                'block text-left text-sm leading-6 text-foreground',
                showPlaceholder ? 'text-muted-foreground/70' : '',
              )}
            >
              {showPlaceholder ? data.placeholder : data.label}
            </span>
          </Card>
        )}
      </div>

      {selected && !data.isEditing ? (
        <div className="nodrag nopan absolute left-1/2 top-[calc(100%+0.55rem)] z-[2] flex -translate-x-1/2 gap-2">
          <Button
            className="h-8 rounded-full px-3 text-xs shadow-[0_12px_24px_rgba(17,24,39,0.18)]"
            onClick={() => data.onQuickAddChild(data.id)}
            size="sm"
            type="button"
          >
            <Plus />
            자식
          </Button>
          <Button
            className="h-8 rounded-full border-white/60 bg-white/92 px-3 text-xs text-foreground shadow-[0_12px_24px_rgba(17,24,39,0.14)] hover:bg-white"
            onClick={() => data.onOpenMore(data.id)}
            size="sm"
            type="button"
            variant="outline"
          >
            <MoreHorizontal />
          </Button>
        </div>
      ) : null}

      <Handle
        className="!size-2.5 !border-0 !bg-transparent"
        id="right-source"
        position={Position.Right}
        style={{ opacity: 0.001 }}
        type="source"
      />
      <Handle
        className="!size-2.5 !border-0 !bg-transparent"
        id="right-target"
        position={Position.Right}
        style={{ opacity: data.isRoot ? 0 : 0.001 }}
        type="target"
      />
    </div>
  )
}
