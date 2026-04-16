import type { Edge, XYPosition } from '@xyflow/react'

import type { MindMapNodeRecord, MindMapRecord } from '../types/mindmap'

const ROOT_PLACEHOLDER = '중심 생각'

const BRANCH_COLORS = ['#ef8d74', '#f5b48d', '#7cb7c7', '#4c6f89', '#89b6ff']
const ROOT_BRANCH_RADIUS = 264
const CHILD_BRANCH_DISTANCE = 264
const CHILD_LANE_GAP = 112

function stampMap(map: MindMapRecord) {
  return {
    ...map,
    updatedAt: new Date().toISOString(),
  }
}

function findNode(map: MindMapRecord, nodeId: string) {
  return map.nodes.find((node) => node.id === nodeId)
}

function getChildren(map: MindMapRecord, parentId: string) {
  return map.nodes.filter((node) => node.parentId === parentId)
}

function getRootNode(map: MindMapRecord) {
  return findNode(map, map.rootNodeId)
}

function getRootBranchId(map: MindMapRecord, nodeId: string) {
  let current = findNode(map, nodeId)

  while (current && current.parentId && current.parentId !== map.rootNodeId) {
    current = findNode(map, current.parentId)
  }

  return current?.id ?? map.rootNodeId
}

// 노드가 루트 기준으로 왼쪽/오른쪽 중 어느 쪽에 속하는지 반환
function getNodeSide(map: MindMapRecord, nodeId: string): 'left' | 'right' {
  const root = getRootNode(map)

  if (!root) {
    return 'right'
  }

  const branchRootId = getRootBranchId(map, nodeId)

  if (branchRootId === map.rootNodeId) {
    return 'right'
  }

  const branchRoot = findNode(map, branchRootId)

  if (!branchRoot) {
    return 'right'
  }

  return branchRoot.position.x < root.position.x ? 'left' : 'right'
}

// 노드 배열을 centerY 기준으로 CHILD_LANE_GAP 간격으로 세로 균등 배치.
// 배열 순서(삽입 순서)를 유지하므로 새 노드는 항상 마지막(아래)에 배치됨.
function distributeVertically(
  nodes: MindMapNodeRecord[],
  centerY: number,
): MindMapNodeRecord[] {
  const N = nodes.length

  return nodes.map((node, i) => ({
    ...node,
    position: {
      ...node.position,
      y: centerY + (i - (N - 1) / 2) * CHILD_LANE_GAP,
    },
  }))
}

// 특정 부모의 자식들을 세로로 재분배.
// 루트 자식은 좌/우 그룹을 각각 독립적으로 재분배.
function redistributeChildrenOf(
  nodes: MindMapNodeRecord[],
  parentId: string,
  parentX: number,
  parentY: number,
  rootNodeId: string,
): MindMapNodeRecord[] {
  const children = nodes.filter((n) => n.parentId === parentId)

  if (children.length === 0) {
    return nodes
  }

  let updated: MindMapNodeRecord[]

  if (parentId === rootNodeId) {
    const rightChildren = children.filter((c) => c.position.x >= parentX)
    const leftChildren = children.filter((c) => c.position.x < parentX)

    updated = [
      ...distributeVertically(rightChildren, parentY),
      ...distributeVertically(leftChildren, parentY),
    ]
  } else {
    updated = distributeVertically(children, parentY)
  }

  const updatedIds = new Set(updated.map((n) => n.id))

  return [...nodes.filter((n) => !updatedIds.has(n.id)), ...updated]
}

// 새 자식 노드의 x 좌표를 컬럼 기반으로 계산
function getNextChildX(map: MindMapRecord, parent: MindMapNodeRecord): number {
  const root = getRootNode(map)

  if (parent.id === map.rootNodeId) {
    const siblings = getChildren(map, parent.id)
    const isRight = siblings.length % 2 === 0

    return parent.position.x + (isRight ? ROOT_BRANCH_RADIUS : -ROOT_BRANCH_RADIUS)
  }

  const side = root
    ? getNodeSide(map, parent.id)
    : 'right'

  return parent.position.x + (side === 'right' ? CHILD_BRANCH_DISTANCE : -CHILD_BRANCH_DISTANCE)
}

function collectDescendantIds(map: MindMapRecord, nodeId: string): Set<string> {
  const bucket = new Set<string>([nodeId])
  let changed = true

  while (changed) {
    changed = false

    for (const node of map.nodes) {
      if (!bucket.has(node.id) && node.parentId && bucket.has(node.parentId)) {
        bucket.add(node.id)
        changed = true
      }
    }
  }

  return bucket
}

export function sanitizeMindMap(map: MindMapRecord) {
  const rootNode = map.nodes.find((node) => node.id === map.rootNodeId) ?? map.nodes[0]

  if (!rootNode) {
    return map
  }

  const reachable = new Set<string>([rootNode.id])
  let changed = true

  while (changed) {
    changed = false

    for (const node of map.nodes) {
      if (node.parentId && reachable.has(node.parentId) && !reachable.has(node.id)) {
        reachable.add(node.id)
        changed = true
      }
    }
  }

  const nodes = map.nodes
    .filter((node) => node.id === rootNode.id || !node.parentId || reachable.has(node.id))
    .map((node) => ({
      ...node,
      parentId: node.id === rootNode.id ? null : node.parentId && reachable.has(node.parentId) ? node.parentId : rootNode.id,
      position: {
        x: Number.isFinite(node.position.x) ? node.position.x : 0,
        y: Number.isFinite(node.position.y) ? node.position.y : 0,
      },
    }))

  return {
    ...map,
    rootNodeId: rootNode.id,
    nodes,
  }
}

export function addChildNode(map: MindMapRecord, parentId: string) {
  const parent = findNode(map, parentId) ?? findNode(map, map.rootNodeId)

  if (!parent) {
    return { map, createdNodeId: map.rootNodeId }
  }

  const childId = crypto.randomUUID()
  const nodesWithChild = [
    ...map.nodes,
    {
      id: childId,
      parentId: parent.id,
      text: '',
      position: {
        x: getNextChildX(map, parent),
        y: parent.position.y,
      },
    },
  ]

  const redistributed = redistributeChildrenOf(
    nodesWithChild,
    parent.id,
    parent.position.x,
    parent.position.y,
    map.rootNodeId,
  )

  return {
    map: stampMap({ ...map, nodes: redistributed }),
    createdNodeId: childId,
  }
}

export function addSiblingNode(map: MindMapRecord, nodeId: string) {
  const node = findNode(map, nodeId)

  if (!node || !node.parentId) {
    return addChildNode(map, map.rootNodeId)
  }

  const parent = findNode(map, node.parentId)

  if (!parent) {
    return addChildNode(map, map.rootNodeId)
  }

  const siblingId = crypto.randomUUID()
  const nodesWithSibling = [
    ...map.nodes,
    {
      id: siblingId,
      parentId: parent.id,
      text: '',
      position: {
        x: getNextChildX(map, parent),
        y: parent.position.y,
      },
    },
  ]

  const redistributed = redistributeChildrenOf(
    nodesWithSibling,
    parent.id,
    parent.position.x,
    parent.position.y,
    map.rootNodeId,
  )

  return {
    map: stampMap({ ...map, nodes: redistributed }),
    createdNodeId: siblingId,
  }
}

export function updateNodeText(map: MindMapRecord, nodeId: string, text: string) {
  return stampMap({
    ...map,
    title:
      nodeId === map.rootNodeId && text.trim()
        ? text.trim()
        : map.title,
    nodes: map.nodes.map((node) =>
      node.id === nodeId
        ? {
            ...node,
            text: nodeId === map.rootNodeId && text.length === 0 ? '' : text,
          }
        : node,
    ),
  })
}

export function moveNode(map: MindMapRecord, nodeId: string, position: XYPosition) {
  return stampMap({
    ...map,
    nodes: map.nodes.map((node) =>
      node.id === nodeId
        ? { ...node, position }
        : node,
    ),
  })
}

export function updateViewport(map: MindMapRecord, viewport: MindMapRecord['viewport']) {
  return {
    ...map,
    viewport,
  }
}

export function removeNode(map: MindMapRecord, nodeId: string) {
  if (nodeId === map.rootNodeId) {
    return { map, nextSelectedNodeId: map.rootNodeId }
  }

  const target = findNode(map, nodeId)

  if (!target) {
    return { map, nextSelectedNodeId: map.rootNodeId }
  }

  const blocked = collectDescendantIds(map, nodeId)
  let nodesAfterRemoval = map.nodes.filter((node) => !blocked.has(node.id))

  if (target.parentId) {
    const parent = map.nodes.find((n) => n.id === target.parentId)

    if (parent) {
      nodesAfterRemoval = redistributeChildrenOf(
        nodesAfterRemoval,
        target.parentId,
        parent.position.x,
        parent.position.y,
        map.rootNodeId,
      )
    }
  }

  return {
    map: stampMap({ ...map, nodes: nodesAfterRemoval }),
    nextSelectedNodeId: target.parentId ?? map.rootNodeId,
  }
}

export function buildBranchColorMap(map: MindMapRecord) {
  const rootChildren = getChildren(map, map.rootNodeId)
  const branchRoots = new Map(rootChildren.map((node, index) => [node.id, BRANCH_COLORS[index % BRANCH_COLORS.length]]))
  const colorMap = new Map<string, string>()

  colorMap.set(map.rootNodeId, '#1f2630')

  for (const node of map.nodes) {
    if (node.id === map.rootNodeId) {
      continue
    }

    const branchId = getRootBranchId(map, node.id)
    colorMap.set(node.id, branchRoots.get(branchId) ?? BRANCH_COLORS[0])
  }

  return colorMap
}

export function buildFlowEdges(map: MindMapRecord) {
  const branchColors = buildBranchColorMap(map)

  return map.nodes
    .filter((node) => node.parentId)
    .map((node) => {
      const color = branchColors.get(node.id) ?? '#89b6ff'
      const parent = findNode(map, node.parentId as string)
      const isLeftSide = parent ? node.position.x < parent.position.x : false

      return {
        id: `${node.parentId}-${node.id}`,
        source: node.parentId as string,
        target: node.id,
        sourceHandle: isLeftSide ? 'left-source' : 'right-source',
        targetHandle: isLeftSide ? 'right-target' : 'left-target',
        type: 'bezier',
        animated: false,
        style: {
          stroke: color,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          strokeWidth: 2.2,
        },
      } satisfies Edge
    })
}

export function getNodeLabel(node: MindMapNodeRecord) {
  return node.text.trim() || ROOT_PLACEHOLDER
}
