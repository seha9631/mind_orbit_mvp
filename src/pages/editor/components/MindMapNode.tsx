import { useEffect, useRef, type CSSProperties } from 'react'
import { Handle, NodeResizeControl, Position, type NodeProps } from '@xyflow/react'
import { Plus } from 'lucide-react'

import { Card } from '../../../shared/ui/card'
import { Input } from '../../../shared/ui/input'
import { cn } from '../../../shared/lib/utils'
import type { MindFlowNode } from '../mindNodeTypes'

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

function getChildButtonClass(branchSide: MindFlowNode['data']['branchSide']) {
  return branchSide === 'left'
    ? 'right-[calc(100%+0.55rem)] top-1/2 -translate-y-1/2'
    : 'left-[calc(100%+0.55rem)] top-1/2 -translate-y-1/2'
}

const quickAddButtonClass =
  'nodrag nopan absolute z-[4] inline-flex size-[22px] items-center justify-center rounded-full bg-primary px-0 text-primary-foreground shadow-[0_10px_20px_rgba(43,131,255,0.24)] transition-colors duration-200 ease-out hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background [&_svg]:size-[11px] [&_svg]:shrink-0'

export function MindMapNode({ data, selected }: NodeProps<MindFlowNode>) {
  const longPressRef = useRef<number | null>(null)
  const longPressTriggeredRef = useRef(false)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null)
  const startEditingFrameRef = useRef<number | null>(null)

  function clearLongPress() {
    if (longPressRef.current) {
      window.clearTimeout(longPressRef.current)
      longPressRef.current = null
    }
  }

  function clearPendingStartEditing() {
    if (startEditingFrameRef.current) {
      window.cancelAnimationFrame(startEditingFrameRef.current)
      startEditingFrameRef.current = null
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

  useEffect(() => clearPendingStartEditing, [])

  function startEditingFromGesture() {
    clearPendingStartEditing()

    // Let the originating tap/click sequence finish before mounting the input,
    // otherwise the trailing pointer events can immediately blur it again.
    startEditingFrameRef.current = window.requestAnimationFrame(() => {
      startEditingFrameRef.current = null
      data.onStartEditing(data.id)
    })
  }

  function startNextNodeEdit(direction: 'child' | 'sibling') {
    if (direction === 'child' || !data.canAddSibling) {
      data.onQuickAddChild(data.id)
      return
    }

    data.onQuickAddSibling(data.id)
  }

  const showPlaceholder = !data.label.trim()
  const hasCustomSize = !!data.size
  const widthClass = hasCustomSize
    ? 'h-full w-full'
    : getWidthClass(data.deviceClass, showPlaceholder)
  const showNodeActions = selected
  const showDesktopHint = showNodeActions && data.deviceClass === 'desktop'
  const showResizeHandle = selected
  const selectedOutlineColor = withAlpha(data.color, 0.7)
  const idleOutlineColor = withAlpha(data.color, data.isRoot ? 0.18 : 0.1)
  const surfaceStyle: CSSProperties = {
    borderColor: selected ? selectedOutlineColor : idleOutlineColor,
    borderWidth: selected ? 3 : 1.5,
    borderBottomRightRadius: selected ? 0 : undefined,
    boxShadow: selected
      ? `0 20px 44px rgba(17, 24, 39, 0.1), 0 0 0 6px ${withAlpha(data.color, 0.2)}`
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
      {showResizeHandle ? (
        <NodeResizeControl
          className="nodrag nopan !z-[5] !size-0 !border-0 !bg-transparent"
          maxHeight={240}
          maxWidth={440}
          minHeight={56}
          minWidth={168}
          onResizeEnd={(_event, params) => {
            data.onResizeEnd(data.id, {
              height: params.height,
              width: params.width,
            })
          }}
          onResizeStart={() => {
            data.onSelect(data.id)
          }}
          position="bottom-right"
        >
          <span
            className="block size-[13px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[1.75px] bg-white"
            style={{
              borderColor: selectedOutlineColor,
              boxShadow: `0 0 0 2.8px ${selectedOutlineColor}, 0 8px 18px ${withAlpha(data.color, 0.18)}`,
            }}
          />
        </NodeResizeControl>
      ) : null}

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
              'nodrag nopan rounded-[20px] bg-white/95 px-4 py-3 shadow-[0_18px_36px_rgba(17,24,39,0.08)]',
              data.touchPrimary ? 'text-base' : 'text-sm',
              widthClass,
              hasCustomSize ? 'h-full min-h-[3.5rem]' : '',
              data.isRoot ? 'font-semibold' : '',
            )}
            data-editor-input="true"
            inputMode="text"
            onChange={(event) => data.onChangeLabel(data.id, event.target.value)}
            onClick={(event) => {
              event.stopPropagation()
            }}
            onKeyDown={(event) => {
              if (event.nativeEvent.isComposing) {
                return
              }

              if (event.key === 'Tab') {
                event.preventDefault()
                event.stopPropagation()
                startNextNodeEdit('child')
                return
              }

              if (event.key === 'Enter') {
                event.preventDefault()
                event.stopPropagation()
                startNextNodeEdit('sibling')
                return
              }

              if (event.key === 'Escape') {
                event.preventDefault()
                event.stopPropagation()
                data.onStopEditing()
              }
            }}
            onPointerDown={(event) => {
              event.stopPropagation()
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
              hasCustomSize ? 'flex h-full min-h-[3.5rem] items-start' : '',
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

      {showNodeActions ? (
        <>
          <button
            aria-label="자식 노드 추가"
            className={cn(
              quickAddButtonClass,
              getChildButtonClass(data.branchSide),
            )}
            onClick={() => data.onQuickAddChild(data.id)}
            type="button"
          >
            <Plus />
          </button>

          {data.canAddSibling ? (
            <button
              aria-label="형제 노드 추가"
              className={cn(
                quickAddButtonClass,
                'left-1/2 top-[calc(100%+0.65rem)] -translate-x-1/2',
              )}
              onClick={() => data.onQuickAddSibling(data.id)}
              type="button"
            >
              <Plus />
            </button>
          ) : null}

          {showDesktopHint ? (
            <div className="nodrag nopan absolute left-[calc(100%+4.3rem)] top-1/2 z-[4] grid min-w-40 -translate-y-1/2 gap-2 rounded-[22px] border border-white/55 bg-white/88 p-3 shadow-[0_18px_36px_rgba(17,24,39,0.12)] backdrop-blur-xl">
              <div className="flex items-center gap-2 text-xs text-foreground/80">
                <span className="rounded-xl border border-slate-300 bg-white px-2 py-1 font-semibold text-foreground">
                  Tab
                </span>
                <span>하위레벨 생성</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-foreground/80">
                <span className="rounded-xl border border-slate-300 bg-white px-2 py-1 font-semibold text-foreground">
                  Enter
                </span>
                <span>동일레벨 생성</span>
              </div>
            </div>
          ) : null}
        </>
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
