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

export type RFState = {
  mapId: string;
  nodes: Node[];
  edges: Edge[];
  saveStatus: SaveStatus;
  setMapId: (id: string) => void;
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  addChildNode: (parentNode: Node, position: XYPosition) => void;
  addRootNode: (position: XYPosition) => void;
  updateNodeLabel: (nodeId: string, label: string) => void;
  deleteNode: (nodeId: string) => void;
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
  nodes: [],
  edges: [],
  saveStatus: 'idle',

  setMapId: (id: string) => set({ mapId: id }),

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

    const newEdge: Edge = {
      id: nanoid(),
      source: parentNode.id,
      target: newNode.id,
    };

    const nodes = [...get().nodes, newNode];
    const edges = [...get().edges, newEdge];
    set({ nodes, edges });
    scheduleSave(get().mapId, nodes, edges, notify(set));
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

  updateNodeLabel: (nodeId: string, label: string) => {
    const nodes = get().nodes.map((node) =>
      node.id === nodeId ? { ...node, data: { ...node.data, label } } : node,
    );
    set({ nodes });
    scheduleSave(get().mapId, nodes, get().edges, notify(set));
  },

  deleteNode: (nodeId: string) => {
    const { nodes, edges } = get();

    const getAllDescendantIds = (id: string): string[] => {
      const childIds = nodes.filter((n) => n.parentId === id).map((n) => n.id);
      return childIds.flatMap((childId) => [childId, ...getAllDescendantIds(childId)]);
    };

    const idsToDelete = new Set([nodeId, ...getAllDescendantIds(nodeId)]);
    const newNodes = nodes.filter((n) => !idsToDelete.has(n.id));
    const newEdges = edges.filter(
      (e) => !idsToDelete.has(e.source) && !idsToDelete.has(e.target),
    );

    set({ nodes: newNodes, edges: newEdges });
    scheduleSave(get().mapId, newNodes, newEdges, notify(set));
  },

  loadFromDB: async () => {
    const { mapId } = get();
    if (!mapId) return;
    const { nodes, edges } = await loadMap(mapId);
    set({ nodes, edges });
  },
}));

export default useStore;
