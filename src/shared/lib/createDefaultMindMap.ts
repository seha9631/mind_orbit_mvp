import type { MindMapRecord } from '../types/mindmap'

const DEFAULT_ROOT_TEXT = '중심 생각'

export function createDefaultMindMap(title: string) {
  const now = new Date().toISOString()
  const rootId = crypto.randomUUID()

  const safeTitle = title.trim() || '새 마인드맵'

  return {
    id: crypto.randomUUID(),
    title: safeTitle,
    createdAt: now,
    updatedAt: now,
    rootNodeId: rootId,
    viewport: {
      x: 0,
      y: 0,
      zoom: 1,
    },
    nodes: [
      {
        id: rootId,
        parentId: null,
        text: safeTitle === '새 마인드맵' ? DEFAULT_ROOT_TEXT : safeTitle,
        position: {
          x: 0,
          y: 0,
        },
      },
    ],
  } satisfies MindMapRecord
}
