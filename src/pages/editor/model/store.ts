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
import { loadMap, saveMapNow, scheduleSave } from './persistence';

const MAP_ID = 'default';

const INITIAL_NODES: Node[] = [
  {
    id: 'root',
    type: 'mindmap',
    data: { label: 'React Flow' },
    position: { x: 0, y: 0 },
  },
  {
    id: '1',
    type: 'mindmap',
    data: { label: 'Website' },
    position: { x: -20, y: -110 },
    parentId: 'root',
  },
  {
    id: '1-1',
    type: 'mindmap',
    data: { label: 'Docs' },
    position: { x: -40, y: -50 },
    parentId: '1',
  },
  {
    id: '1-2',
    type: 'mindmap',
    data: { label: 'Examples' },
    position: { x: 60, y: -60 },
    parentId: '1',
  },
  {
    id: '2',
    type: 'mindmap',
    data: { label: 'Github' },
    position: { x: -120, y: 80 },
    parentId: 'root',
  },
  {
    id: '2-1',
    type: 'mindmap',
    data: { label: 'Issues' },
    position: { x: -70, y: 10 },
    parentId: '2',
  },
  {
    id: '2-2',
    type: 'mindmap',
    data: { label: 'PRs' },
    position: { x: -20, y: 50 },
    parentId: '2',
  },
  {
    id: '3',
    type: 'mindmap',
    data: { label: 'React Flow Pro' },
    position: { x: 200, y: 70 },
    parentId: 'root',
  },
  {
    id: '3-1',
    type: 'mindmap',
    data: { label: 'Pro Examples' },
    position: { x: 80, y: 60 },
    parentId: '3',
  },
];

const INITIAL_EDGES: Edge[] = [
  { id: 'e-r-1', source: 'root', target: '1' },
  { id: 'e-1-11', source: '1', target: '1-1' },
  { id: 'e-1-12', source: '1', target: '1-2' },
  { id: 'e-r-2', source: 'root', target: '2' },
  { id: 'e-2-21', source: '2', target: '2-1' },
  { id: 'e-2-22', source: '2', target: '2-2' },
  { id: 'e-r-3', source: 'root', target: '3' },
  { id: 'e-3-31', source: '3', target: '3-1' },
];

export type RFState = {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  addChildNode: (parentNode: Node, position: XYPosition) => void;
  updateNodeLabel: (nodeId: string, label: string) => void;
  loadFromDB: () => Promise<void>;
};

const useStore = create<RFState>((set, get) => ({
  nodes: INITIAL_NODES,
  edges: INITIAL_EDGES,

  onNodesChange: (changes: NodeChange[]) => {
    const nodes = applyNodeChanges(changes, get().nodes);
    set({ nodes });
    scheduleSave(MAP_ID, nodes, get().edges);
  },

  onEdgesChange: (changes: EdgeChange[]) => {
    const edges = applyEdgeChanges(changes, get().edges);
    set({ edges });
    scheduleSave(MAP_ID, get().nodes, edges);
  },

  addChildNode: (parentNode: Node, position: XYPosition) => {
    const newNode: Node = {
      id: nanoid(),
      type: 'mindmap',
      data: { label: 'New Node' },
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
    scheduleSave(MAP_ID, nodes, edges);
  },

  updateNodeLabel: (nodeId: string, label: string) => {
    const nodes = get().nodes.map((node) =>
      node.id === nodeId ? { ...node, data: { ...node.data, label } } : node,
    );
    set({ nodes });
    scheduleSave(MAP_ID, nodes, get().edges);
  },

  loadFromDB: async () => {
    const { nodes, edges } = await loadMap(MAP_ID);

    if (nodes.length > 0) {
      set({ nodes, edges });
    } else {
      await saveMapNow(MAP_ID, get().nodes, get().edges);
    }
  },
}));

export default useStore;
