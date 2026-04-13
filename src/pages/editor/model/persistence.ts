import type { Edge, Node } from '@xyflow/react';
import type { NodeRecord, EdgeRecord } from '../../../services/db/schema';
import { nodeRepository } from '../../../services/db/repositories/nodeRepository';
import { edgeRepository } from '../../../services/db/repositories/edgeRepository';

// ─── 타입 변환 ────────────────────────────────────────────────────────────────

export function toNodeRecord(node: Node, mapId: string): NodeRecord {
  return {
    id: node.id,
    mapId,
    type: node.type ?? 'mindmap',
    label: String(node.data?.label ?? ''),
    x: node.position.x,
    y: node.position.y,
    parentId: node.parentId,
  };
}

export function fromNodeRecord(record: NodeRecord): Node {
  return {
    id: record.id,
    type: record.type,
    data: { label: record.label },
    position: { x: record.x, y: record.y },
    ...(record.parentId ? { parentId: record.parentId } : {}),
  };
}

export function toEdgeRecord(edge: Edge, mapId: string): EdgeRecord {
  return {
    id: edge.id,
    mapId,
    source: edge.source,
    target: edge.target,
  };
}

export function fromEdgeRecord(record: EdgeRecord): Edge {
  return {
    id: record.id,
    source: record.source,
    target: record.target,
  };
}

// ─── DB 저장 ─────────────────────────────────────────────────────────────────

let saveTimer: ReturnType<typeof setTimeout> | null = null;

/** 드래그 등 연속적인 변경에서 과도한 쓰기를 막기 위한 디바운스 저장 */
export function scheduleSave(mapId: string, nodes: Node[], edges: Edge[], delay = 500) {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveMapNow(mapId, nodes, edges);
  }, delay);
}

/** 즉시 저장 (첫 로드 후 초기 데이터 저장 등에 사용) */
export async function saveMapNow(mapId: string, nodes: Node[], edges: Edge[]) {
  await Promise.all([
    nodeRepository.replaceAll(mapId, nodes.map((n) => toNodeRecord(n, mapId))),
    edgeRepository.replaceAll(mapId, edges.map((e) => toEdgeRecord(e, mapId))),
  ]);
}

// ─── DB 로드 ─────────────────────────────────────────────────────────────────

/** mapId에 해당하는 노드/에지를 DB에서 불러온다 */
export async function loadMap(
  mapId: string,
): Promise<{ nodes: Node[]; edges: Edge[] }> {
  const [nodeRecords, edgeRecords] = await Promise.all([
    nodeRepository.getByMapId(mapId),
    edgeRepository.getByMapId(mapId),
  ]);

  return {
    nodes: nodeRecords.map(fromNodeRecord),
    edges: edgeRecords.map(fromEdgeRecord),
  };
}
