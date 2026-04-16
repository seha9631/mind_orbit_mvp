import {
  applyNodeChanges,
  applyEdgeChanges,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
  type OnNodesChange,
  type OnEdgesChange,
  type XYPosition,
} from '@xyflow/react';
import { create } from 'zustand';
import { nanoid } from 'nanoid/non-secure';
import { type SaveStatus, loadMap, scheduleSave } from './persistence';
import { mapRepository } from '../../../services/db/repositories/mapRepository';

type NodeDataShape = { label: string; collapsed?: boolean };

/** 각 노드의 hidden 상태를 조상의 collapsed 기준으로 재계산 */
function rebuildHiddenState(nodes: Node[]): Node[] {
  const hasCollapsedAncestor = (nodeId: string): boolean => {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node?.parentId) return false;
    const parent = nodes.find((n) => n.id === node.parentId);
    if (!parent) return false;
    if ((parent.data as NodeDataShape).collapsed) return true;
    return hasCollapsedAncestor(parent.id);
  };
  return nodes.map((n) => ({ ...n, hidden: hasCollapsedAncestor(n.id) }));
}

export type RFState = {
  mapId: string;
  mapTitle: string;
  nodes: Node[];
  edges: Edge[];
  saveStatus: SaveStatus;
  deleteMode: boolean;
  setMapId: (id: string) => void;
  setMapTitle: (title: string) => void;
  setDeleteMode: (active: boolean) => void;
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  addChildNode: (parentNode: Node, position: XYPosition) => void;
  addChildToNode: (nodeId: string) => void;
  addRootNode: (position: XYPosition) => void;
  addSiblingNode: (nodeId: string) => void;
  updateNodeLabel: (nodeId: string, label: string) => void;
  deleteNode: (nodeId: string) => void;
  toggleCollapse: (nodeId: string) => void;
  loadFromDB: () => Promise<void>;
};

const notify = (set: (partial: Partial<RFState>) => void) => (status: SaveStatus) => {
  set({ saveStatus: status });
  if (status === 'saved') {
    setTimeout(() => set({ saveStatus: 'idle' }), 2000);
  }
};

const useStore = create<RFState>((set, get) => ({
  mapId: '',
  mapTitle: '',
  nodes: [],
  edges: [],
  saveStatus: 'idle',
  deleteMode: false,

  setMapId: (id) => set({ mapId: id }),
  setMapTitle: (title) => set({ mapTitle: title }),
  setDeleteMode: (active) => set({ deleteMode: active }),

  onNodesChange: (changes: NodeChange[]) => {
    const nodes = applyNodeChanges(changes, get().nodes);
    set({ nodes });
    scheduleSave(get().mapId, nodes, get().edges, notify(set));
  },

  onEdgesChange: (changes: EdgeChange[]) => {
    const edges = applyEdgeChanges(changes, get().edges);
    set({ edges });
    scheduleSave(get().mapId, get().nodes, edges, notify(set));
  },

  addChildNode: (parentNode: Node, position: XYPosition) => {
    const newNode: Node = {
      id: nanoid(),
      type: 'mindmap',
      data: { label: '새 노드' },
      position,
      parentId: parentNode.id,
    };
    const newEdge: Edge = { id: nanoid(), source: parentNode.id, target: newNode.id };
    const nodes = [...get().nodes, newNode];
    const edges = [...get().edges, newEdge];
    set({ nodes, edges });
    scheduleSave(get().mapId, nodes, edges, notify(set));
  },

  addChildToNode: (nodeId: string) => {
    const node = get().nodes.find((n) => n.id === nodeId);
    if (node) get().addChildNode(node, { x: 150, y: 0 });
  },

  addRootNode: (position: XYPosition) => {
    const newNode: Node = {
      id: nanoid(),
      type: 'mindmap',
      data: { label: '새 노드' },
      position,
    };
    const nodes = [...get().nodes, newNode];
    set({ nodes });
    scheduleSave(get().mapId, nodes, get().edges, notify(set));
  },

  addSiblingNode: (nodeId: string) => {
    const { nodes } = get();
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;
    if (node.parentId) {
      const parent = nodes.find((n) => n.id === node.parentId);
      if (parent) get().addChildNode(parent, { x: node.position.x, y: node.position.y + 60 });
    } else {
      get().addRootNode({ x: node.position.x + 20, y: node.position.y + 60 });
    }
  },

  updateNodeLabel: (nodeId: string, label: string) => {
    const nodes = get().nodes.map((n) =>
      n.id === nodeId ? { ...n, data: { ...n.data, label } } : n,
    );
    set({ nodes });
    scheduleSave(get().mapId, nodes, get().edges, notify(set));
  },

  deleteNode: (nodeId: string) => {
    const { nodes, edges } = get();
    const getAllDescendantIds = (id: string): string[] => {
      const childIds = nodes.filter((n) => n.parentId === id).map((n) => n.id);
      return childIds.flatMap((cid) => [cid, ...getAllDescendantIds(cid)]);
    };
    const idsToDelete = new Set([nodeId, ...getAllDescendantIds(nodeId)]);
    const newNodes = nodes.filter((n) => !idsToDelete.has(n.id));
    const newEdges = edges.filter(
      (e) => !idsToDelete.has(e.source) && !idsToDelete.has(e.target),
    );
    set({ nodes: newNodes, edges: newEdges });
    scheduleSave(get().mapId, newNodes, newEdges, notify(set));
  },

  toggleCollapse: (nodeId: string) => {
    const { nodes, edges } = get();
    const withToggled = nodes.map((n) =>
      n.id === nodeId
        ? { ...n, data: { ...n.data, collapsed: !(n.data as NodeDataShape).collapsed } }
        : n,
    );
    const newNodes = rebuildHiddenState(withToggled);
    const hiddenIds = new Set(newNodes.filter((n) => n.hidden).map((n) => n.id));
    const newEdges = edges.map((e) => ({
      ...e,
      hidden: hiddenIds.has(e.source) || hiddenIds.has(e.target),
    }));
    set({ nodes: newNodes, edges: newEdges });
    scheduleSave(get().mapId, newNodes, newEdges, notify(set));
  },

  loadFromDB: async () => {
    const { mapId } = get();
    if (!mapId) return;
    const [mapData, { nodes, edges }] = await Promise.all([
      mapRepository.getById(mapId),
      loadMap(mapId),
    ]);
    const rebuiltNodes = rebuildHiddenState(nodes);
    const hiddenIds = new Set(rebuiltNodes.filter((n) => n.hidden).map((n) => n.id));
    const rebuiltEdges = edges.map((e) => ({
      ...e,
      hidden: hiddenIds.has(e.source) || hiddenIds.has(e.target),
    }));
    set({
      nodes: rebuiltNodes,
      edges: rebuiltEdges,
      mapTitle: mapData?.title ?? 'Untitled',
    });
  },
}));

export default useStore;
