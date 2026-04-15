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

const SAVE_STATUS_LABEL: Record<string, string> = {
  saving: '저장 중...',
  saved: '저장됨',
  error: '저장 실패',
};

interface MindMapCanvasProps {
  onBack?: () => void;
}

export default function MindMapCanvas({ onBack }: MindMapCanvasProps) {
  const {
    nodes,
    edges,
    saveStatus,
    onNodesChange,
    onEdgesChange,
    addChildNode,
    addRootNode,
    deleteNode,
    loadFromDB,
  } = useStore();
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

  // P0: FAB 핸들러 — 뷰포트 중앙에 독립 노드 생성
  const handleFabClick = useCallback(() => {
    const position = screenToFlowPosition({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    });
    addRootNode(position);
  }, [screenToFlowPosition, addRootNode]);

  // P3: 키보드 단축키
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;

      const selectedNode = nodes.find((n) => n.selected);
      if (!selectedNode) return;

      if (e.key === 'Tab') {
        e.preventDefault();
        addChildNode(selectedNode, { x: 150, y: 0 });
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const parentNode = selectedNode.parentId
          ? nodes.find((n) => n.id === selectedNode.parentId)
          : null;
        if (parentNode) {
          addChildNode(parentNode, {
            x: selectedNode.position.x,
            y: selectedNode.position.y + 60,
          });
        } else {
          addRootNode(
            screenToFlowPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 }),
          );
        }
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        deleteNode(selectedNode.id);
      }
    },
    [nodes, addChildNode, addRootNode, deleteNode, screenToFlowPosition],
  );

  return (
    <div
      style={{ width: '100%', height: '100vh', touchAction: 'none' }}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
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
        panOnScroll={false}
        zoomOnPinch
        fitView
      >
        <Controls showInteractive={false} />
        <Panel position="top-left" className="header">
          {onBack && (
            <button className="backBtn" onClick={onBack}>
              ← 목록
            </button>
          )}
        </Panel>
        {saveStatus !== 'idle' && (
          <Panel position="top-right">
            <span className={`saveStatus saveStatus--${saveStatus}`}>
              {SAVE_STATUS_LABEL[saveStatus]}
            </span>
          </Panel>
        )}
      </ReactFlow>

      {/* P0: 모바일 FAB 버튼 */}
      <button className="fab" onClick={handleFabClick} aria-label="새 노드 추가">
        +
      </button>
    </div>
  );
}
