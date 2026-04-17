import type { Edge, XYPosition } from '@xyflow/react'

import type { MindMapNodeRecord, MindMapRecord, NodeSize } from '../types/mindmap'

const ROOT_PLACEHOLDER = '중심 생각'

const BRANCH_COLORS = ['#ef8d74', '#f5b48d', '#7cb7c7', '#4c6f89', '#89b6ff']
const ROOT_BRANCH_RADIUS = 264
const CHILD_BRANCH_DISTANCE = 264
const CHILD_LANE_GAP = 112
const SEARCH_FORWARD_STEP = 108
const SEARCH_LATERAL_STEP = 104
const MAX_POSITION_SEARCH_DEPTH = 10
const MAX_POSITION_SEARCH_LANES = 6
const MIN_NODE_CENTER_GAP_X = 248
const MIN_NODE_CENTER_GAP_Y = 92
const MIN_NODE_WIDTH = 168
const MIN_NODE_HEIGHT = 56
const MAX_NODE_WIDTH = 440
const MAX_NODE_HEIGHT = 240

function stampMap(map: MindMapRecord) {
  return {
    ...map,
    updatedAt: new Date().toISOString(),
  }
}

function normalizeNodeSize(size: Partial<NodeSize> | undefined) {
  if (!size) {
    return undefined
  }

  const width = Number.isFinite(size.width) ? Math.round(size.width as number) : MIN_NODE_WIDTH
  const height = Number.isFinite(size.height) ? Math.round(size.height as number) : MIN_NODE_HEIGHT

  return {
    width: Math.max(MIN_NODE_WIDTH, Math.min(MAX_NODE_WIDTH, width)),
    height: Math.max(MIN_NODE_HEIGHT, Math.min(MAX_NODE_HEIGHT, height)),
  } satisfies NodeSize
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

function getNodeSide(map: MindMapRecord, nodeId: string): 'left' | 'right' {
  const root = getRootNode(map)

  if (!root) {
    return 'right'
  }

  const branchRootId = getRootBranchId(map, nodeId)
  const branchRoot = findNode(map, branchRootId)

  if (!branchRoot) {
    return 'right'
  }

  return branchRoot.position.x < root.position.x ? 'left' : 'right'
}

function getPerpendicular(vector: XYPosition) {
  return {
    x: -vector.y,
    y: vector.x,
  }
}

function orientVectorTopToBottom(vector: XYPosition) {
  if (vector.y > 0) {
    return vector
  }

  if (vector.y < 0) {
    return {
      x: -vector.x,
      y: -vector.y,
    }
  }

  return vector.x >= 0
    ? vector
    : {
        x: -vector.x,
        y: -vector.y,
      }
}

function getAlternatingOffset(index: number) {
  if (index === 0) {
    return 0
  }

  const lane = Math.ceil(index / 2)

  return index % 2 === 1 ? lane : -lane
}

function normalizeVector(vector: XYPosition, fallback: XYPosition): XYPosition {
  const length = Math.hypot(vector.x, vector.y)

  if (length < 0.0001) {
    return fallback
  }

  return {
    x: vector.x / length,
    y: vector.y / length,
  }
}

function arePositionsTooClose(left: XYPosition, right: XYPosition) {
  return (
    Math.abs(left.x - right.x) < MIN_NODE_CENTER_GAP_X &&
    Math.abs(left.y - right.y) < MIN_NODE_CENTER_GAP_Y
  )
}

function isPositionOccupied(map: MindMapRecord, position: XYPosition, excludeNodeId?: string) {
  return map.nodes.some((node) => {
    if (excludeNodeId && node.id === excludeNodeId) {
      return false
    }

    return arePositionsTooClose(node.position, position)
  })
}

function findOpenPosition(
  map: MindMapRecord,
  basePosition: XYPosition,
  forwardVector: XYPosition,
  lateralVector: XYPosition,
  excludeNodeId?: string,
) {
  for (let depth = 0; depth <= MAX_POSITION_SEARCH_DEPTH; depth += 1) {
    for (let laneIndex = 0; laneIndex <= MAX_POSITION_SEARCH_LANES * 2; laneIndex += 1) {
      const laneOffset = getAlternatingOffset(laneIndex)
      const candidate = {
        x:
          basePosition.x +
          forwardVector.x * SEARCH_FORWARD_STEP * depth +
          lateralVector.x * SEARCH_LATERAL_STEP * laneOffset,
        y:
          basePosition.y +
          forwardVector.y * SEARCH_FORWARD_STEP * depth +
          lateralVector.y * SEARCH_LATERAL_STEP * laneOffset,
      }

      if (!isPositionOccupied(map, candidate, excludeNodeId)) {
        return candidate
      }
    }
  }

  return basePosition
}

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

function getNextChildX(map: MindMapRecord, parent: MindMapNodeRecord): number {
  if (parent.id === map.rootNodeId) {
    const siblings = getChildren(map, parent.id)
    const isRight = siblings.length % 2 === 0

    return parent.position.x + (isRight ? ROOT_BRANCH_RADIUS : -ROOT_BRANCH_RADIUS)
  }

  const side = getNodeSide(map, parent.id)

  return parent.position.x + (side === 'right' ? CHILD_BRANCH_DISTANCE : -CHILD_BRANCH_DISTANCE)
}

function getNextChildPosition(map: MindMapRecord, parent: MindMapNodeRecord) {
  const siblings = getChildren(map, parent.id)

  if (parent.id === map.rootNodeId) {
    return {
      x: getNextChildX(map, parent),
      y: parent.position.y,
    }
  }

  const root = getRootNode(map)
  const outwardVector = normalizeVector(
    root
      ? {
          x: parent.position.x - root.position.x,
          y: parent.position.y - root.position.y,
        }
      : {
          x: 1,
          y: 0,
        },
    {
      x: 1,
      y: 0,
    },
  )

  const perpendicular = orientVectorTopToBottom(getPerpendicular(outwardVector))
  const siblingOffset = siblings.length * CHILD_LANE_GAP
  const basePosition = {
    x:
      parent.position.x +
      outwardVector.x * CHILD_BRANCH_DISTANCE +
      perpendicular.x * siblingOffset,
    y:
      parent.position.y +
      outwardVector.y * CHILD_BRANCH_DISTANCE +
      perpendicular.y * siblingOffset,
  }

  return findOpenPosition(map, basePosition, outwardVector, perpendicular)
}

function getNextSiblingPosition(map: MindMapRecord, node: MindMapNodeRecord) {
  if (!node.parentId) {
    return getNextChildPosition(map, node)
  }

  const siblings = getChildren(map, node.parentId)
  const stackBottom = siblings.reduce(
    (currentBottom, sibling) => Math.max(currentBottom, sibling.position.y),
    node.position.y,
  )

  const basePosition = {
    x: node.position.x,
    y: stackBottom + CHILD_LANE_GAP,
  }

  return findOpenPosition(
    map,
    basePosition,
    { x: 0, y: 1 },
    { x: 1, y: 0 },
  )
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
      parentId:
        node.id === rootNode.id
          ? null
          : node.parentId && reachable.has(node.parentId)
            ? node.parentId
            : rootNode.id,
      position: {
        x: Number.isFinite(node.position.x) ? node.position.x : 0,
        y: Number.isFinite(node.position.y) ? node.position.y : 0,
      },
      size: normalizeNodeSize(node.size),
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
      position: getNextChildPosition(map, parent),
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
      parentId: node.parentId,
      text: '',
      position: getNextSiblingPosition(map, node),
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

export function resizeNode(map: MindMapRecord, nodeId: string, size: NodeSize) {
  const normalizedSize = normalizeNodeSize(size)

  return stampMap({
    ...map,
    nodes: map.nodes.map((node) =>
      node.id === nodeId
        ? {
            ...node,
            size: normalizedSize,
          }
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
  const branchRoots = new Map(
    rootChildren.map((node, index) => [node.id, BRANCH_COLORS[index % BRANCH_COLORS.length]]),
  )
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