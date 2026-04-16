import type { Edge, XYPosition } from '@xyflow/react'

import type { MindMapNodeRecord, MindMapRecord } from '../types/mindmap'

const ROOT_PLACEHOLDER = '중심 생각'

const BRANCH_COLORS = ['#ef8d74', '#f5b48d', '#7cb7c7', '#4c6f89', '#89b6ff']
const ROOT_BRANCH_ANGLES = [-12, 28, 68, 122, 180, 220, 258, 308]
const ROOT_BRANCH_RADIUS = 264
const ROOT_BRANCH_RING_STEP = 68
const ROOT_BRANCH_TANGENT_OFFSET = 22
const CHILD_BRANCH_DISTANCE = 264
const CHILD_LANE_GAP = 112
const SEARCH_FORWARD_STEP = 108
const SEARCH_LATERAL_STEP = 104
const MAX_POSITION_SEARCH_DEPTH = 10
const MAX_POSITION_SEARCH_LANES = 6
const MIN_NODE_CENTER_GAP_X = 248
const MIN_NODE_CENTER_GAP_Y = 92

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

function getVectorFromAngle(angle: number) {
  const radians = (angle * Math.PI) / 180

  return {
    x: Math.cos(radians),
    y: Math.sin(radians),
  }
}

function normalizeVector(vector: XYPosition, fallback: XYPosition) {
  const length = Math.hypot(vector.x, vector.y)

  if (length < 0.001) {
    return fallback
  }

  return {
    x: vector.x / length,
    y: vector.y / length,
  }
}

function getPerpendicular(vector: XYPosition) {
  return {
    x: -vector.y,
    y: vector.x,
  }
}

function getAlternatingOffset(index: number) {
  if (index === 0) {
    return 0
  }

  const magnitude = Math.ceil(index / 2)
  return index % 2 === 1 ? magnitude : -magnitude
}

function getRootBranchDirection(index: number) {
  const angle = ROOT_BRANCH_ANGLES[index % ROOT_BRANCH_ANGLES.length]
  return getVectorFromAngle(angle)
}

function collidesWithNode(position: XYPosition, node: MindMapNodeRecord) {
  return (
    Math.abs(position.x - node.position.x) < MIN_NODE_CENTER_GAP_X &&
    Math.abs(position.y - node.position.y) < MIN_NODE_CENTER_GAP_Y
  )
}

function isPositionAvailable(map: MindMapRecord, position: XYPosition) {
  return map.nodes.every((node) => !collidesWithNode(position, node))
}

function findOpenPosition(
  map: MindMapRecord,
  basePosition: XYPosition,
  forwardVector: XYPosition,
  lateralVector: XYPosition,
) {
  if (isPositionAvailable(map, basePosition)) {
    return basePosition
  }

  // Keep searching in a widening grid so newly added nodes preserve a readable gap.
  for (let depth = 0; depth <= MAX_POSITION_SEARCH_DEPTH; depth += 1) {
    for (let laneIndex = 0; laneIndex <= MAX_POSITION_SEARCH_LANES * 2; laneIndex += 1) {
      const laneOffset = getAlternatingOffset(laneIndex)
      const candidate = {
        x:
          basePosition.x +
          forwardVector.x * depth * SEARCH_FORWARD_STEP +
          lateralVector.x * laneOffset * SEARCH_LATERAL_STEP,
        y:
          basePosition.y +
          forwardVector.y * depth * SEARCH_FORWARD_STEP +
          lateralVector.y * laneOffset * SEARCH_LATERAL_STEP,
      }

      if (isPositionAvailable(map, candidate)) {
        return candidate
      }
    }
  }

  return {
    x: basePosition.x + forwardVector.x * (MAX_POSITION_SEARCH_DEPTH + 1) * SEARCH_FORWARD_STEP,
    y: basePosition.y + forwardVector.y * (MAX_POSITION_SEARCH_DEPTH + 1) * SEARCH_FORWARD_STEP,
  }
}

function getNextRootBranchPosition(map: MindMapRecord, parent: MindMapNodeRecord) {
  const siblings = getChildren(map, parent.id)
  const index = siblings.length
  const ring = Math.floor(index / ROOT_BRANCH_ANGLES.length)
  const direction = getRootBranchDirection(index)
  const tangent = getPerpendicular(direction)
  const radius = ROOT_BRANCH_RADIUS + ring * ROOT_BRANCH_RING_STEP
  const tangentOffset = getAlternatingOffset(ring) * ROOT_BRANCH_TANGENT_OFFSET
  const basePosition = {
    x: parent.position.x + direction.x * radius + tangent.x * tangentOffset,
    y: parent.position.y + direction.y * radius + tangent.y * tangentOffset,
  }

  return findOpenPosition(map, basePosition, direction, tangent)
}

function getNextChildPosition(map: MindMapRecord, parent: MindMapNodeRecord) {
  const siblings = getChildren(map, parent.id)

  if (parent.id === map.rootNodeId) {
    return getNextRootBranchPosition(map, parent)
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
  const perpendicular = getPerpendicular(outwardVector)
  const siblingOffset = getAlternatingOffset(siblings.length) * CHILD_LANE_GAP
  const basePosition = {
    x: parent.position.x + outwardVector.x * CHILD_BRANCH_DISTANCE + perpendicular.x * siblingOffset,
    y: parent.position.y + outwardVector.y * CHILD_BRANCH_DISTANCE + perpendicular.y * siblingOffset,
  }

  return findOpenPosition(map, basePosition, outwardVector, perpendicular)
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
  const nextMap = stampMap({
    ...map,
    nodes: [
      ...map.nodes,
      {
        id: childId,
        parentId: parent.id,
        text: '',
        position: getNextChildPosition(map, parent),
      },
    ],
  })

  return { map: nextMap, createdNodeId: childId }
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
  const nextMap = stampMap({
    ...map,
    nodes: [
      ...map.nodes,
      {
        id: siblingId,
        parentId: node.parentId,
        text: '',
        position: getNextChildPosition(map, parent),
      },
    ],
  })

  return { map: nextMap, createdNodeId: siblingId }
}

export function updateNodeText(map: MindMapRecord, nodeId: string, text: string) {
  const nextMap = stampMap({
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

  return nextMap
}

export function moveNode(map: MindMapRecord, nodeId: string, position: XYPosition) {
  return stampMap({
    ...map,
    nodes: map.nodes.map((node) =>
      node.id === nodeId
        ? {
            ...node,
            position,
          }
        : node,
    ),
  })
}

export function updateViewport(map: MindMapRecord, viewport: MindMapRecord['viewport']) {
  return stampMap({
    ...map,
    viewport,
  })
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
  const nextMap = stampMap({
    ...map,
    nodes: map.nodes.filter((node) => !blocked.has(node.id)),
  })

  return {
    map: nextMap,
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

      return {
        id: `${node.parentId}-${node.id}`,
        source: node.parentId as string,
        target: node.id,
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
