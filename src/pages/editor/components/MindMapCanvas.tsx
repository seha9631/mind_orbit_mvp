import {
  ReactFlow,
  Controls,
  Panel,
  type NodeOrigin,
  type OnConnectStart,
  type OnConnectEnd,
  useStoreApi,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useCallback, useEffect, useRef } from 'react';
import useStore from '../model/store';
import MindMapNode from './MindMapNode';
import MindMapEdge from './MindMapEdge';

const nodeTypes = { mindmap: MindMapNode };
const edgeTypes = { mindmap: MindMapEdge };
const nodeOrigin: NodeOrigin = [0.5, 0.5];

export default function MindMapCanvas() {
  const { nodes, edges, onNodesChange, onEdgesChange, addChildNode, loadFromDB } = useStore();
  const connectingNodeId = useRef<string | null>(null);

  useEffect(() => {
    loadFromDB();
  }, [loadFromDB]);
  const store = useStoreApi();
  const { screenToFlowPosition } = useReactFlow();

  const getChildNodePosition = useCallback(
    (event: MouseEvent) => {
      const { nodeLookup } = store.getState();
      const parentNode = nodeLookup.get(connectingNodeId.current!);
      if (
        !parentNode?.internals?.positionAbsolute ||
        !parentNode?.measured?.width ||
        !parentNode?.measured?.height
      ) {
        return;
      }

      const panePosition = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      return {
        x:
          panePosition.x -
          parentNode.internals.positionAbsolute.x +
          parentNode.measured.width / 2,
        y:
          panePosition.y -
          parentNode.internals.positionAbsolute.y +
          parentNode.measured.height / 2,
      };
    },
    [store, screenToFlowPosition],
  );

  const onConnectStart: OnConnectStart = useCallback((_, { nodeId }) => {
    connectingNodeId.current = nodeId;
  }, []);

  const onConnectEnd: OnConnectEnd = useCallback(
    (event) => {
      const { nodeLookup } = store.getState();
      const targetIsPane = (event.target as Element).classList.contains(
        'react-flow__pane',
      );
      const node = (event.target as Element).closest('.react-flow__node');

      if (node) {
        node.querySelector('input')?.focus({ preventScroll: true });
      } else if (targetIsPane && connectingNodeId.current) {
        const parentNode = nodeLookup.get(connectingNodeId.current);
        const childNodePosition = getChildNodePosition(event as MouseEvent);
        if (parentNode && childNodePosition) {
          addChildNode(parentNode, childNodePosition);
        }
      }
    },
    [getChildNodePosition, addChildNode, store],
  );

  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        nodeOrigin={nodeOrigin}
        onConnectStart={onConnectStart}
        onConnectEnd={onConnectEnd}
        fitView
      >
        <Controls showInteractive={false} />
        <Panel position="top-left" className="header">
          Mind Orbit
        </Panel>
      </ReactFlow>
    </div>
  );
}
