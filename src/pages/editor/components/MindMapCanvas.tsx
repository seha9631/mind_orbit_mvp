import {
  ReactFlow,
  Controls,
  Panel,
  type NodeOrigin,
  type OnConnectStart,
  type OnConnectEnd,
  type Node,
  useStoreApi,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useCallback, useEffect, useRef, useState } from 'react';
import useStore from '../model/store';
import MindMapNode from './MindMapNode';
import MindMapEdge from './MindMapEdge';
import { mapRepository } from '../../../services/db/repositories/mapRepository';

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
    mapId,
    mapTitle,
    nodes,
    edges,
    saveStatus,
    deleteMode,
    onNodesChange,
    onEdgesChange,
    addChildNode,
    addRootNode,
    deleteNode,
    setDeleteMode,
    setMapTitle,
    loadFromDB,
  } = useStore();

  const connectingNodeId = useRef<string | null>(null);
  const trashRef = useRef<HTMLDivElement>(null);
  const [trashHovered, setTrashHovered] = useState(false);

  // 맵 제목 인라인 편집
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const titleLongPressTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    loadFromDB();
  }, [loadFromDB]);

  const store = useStoreApi();
  const { screenToFlowPosition } = useReactFlow();

  // ─── 맵 제목 편집 ──────────────────────────────────────────────────────────

  const handleTitlePointerDown = () => {
    titleLongPressTimer.current = setTimeout(() => {
      setTitleDraft(mapTitle);
      setEditingTitle(true);
    }, 500);
  };

  const handleTitlePointerUp = () => clearTimeout(titleLongPressTimer.current);

  const handleTitleSave = async () => {
    setEditingTitle(false);
    const trimmed = titleDraft.trim() || 'Untitled';
    if (trimmed === mapTitle) return;
    setMapTitle(trimmed);
    await mapRepository.update(mapId, { title: trimmed });
  };

  // ─── 드래그로 자식 노드 생성 ────────────────────────────────────────────────

  const getChildNodePosition = useCallback(
    (event: MouseEvent) => {
      const { nodeLookup } = store.getState();
      const parentNode = nodeLookup.get(connectingNodeId.current!);
      if (
        !parentNode?.internals?.positionAbsolute ||
        !parentNode?.measured?.width ||
        !parentNode?.measured?.height
      ) return;

      const panePosition = screenToFlowPosition({ x: event.clientX, y: event.clientY });
      return {
        x: panePosition.x - parentNode.internals.positionAbsolute.x + parentNode.measured.width / 2,
        y: panePosition.y - parentNode.internals.positionAbsolute.y + parentNode.measured.height / 2,
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
      const targetIsPane = (event.target as Element).classList.contains('react-flow__pane');
      const node = (event.target as Element).closest('.react-flow__node');

      if (node) {
        node.querySelector('input')?.focus({ preventScroll: true });
      } else if (targetIsPane && connectingNodeId.current) {
        const parentNode = nodeLookup.get(connectingNodeId.current);
        const childNodePosition = getChildNodePosition(event as MouseEvent);
        if (parentNode && childNodePosition) addChildNode(parentNode, childNodePosition);
      }
    },
    [getChildNodePosition, addChildNode, store],
  );

  // ─── 휴지통 드래그 삭제 ────────────────────────────────────────────────────

  const isOverTrash = useCallback((clientX: number, clientY: number) => {
    const rect = trashRef.current?.getBoundingClientRect();
    if (!rect) return false;
    return clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom;
  }, []);

  const handleNodeDrag = useCallback(
    (event: React.MouseEvent) => {
      if (!deleteMode) return;
      setTrashHovered(isOverTrash(event.clientX, event.clientY));
    },
    [deleteMode, isOverTrash],
  );

  const handleNodeDragStop = useCallback(
    (event: React.MouseEvent, node: Node) => {
      if (!deleteMode) return;
      if (isOverTrash(event.clientX, event.clientY)) {
        deleteNode(node.id);
      }
      setDeleteMode(false);
      setTrashHovered(false);
    },
    [deleteMode, isOverTrash, deleteNode, setDeleteMode],
  );

  // 캔버스 클릭 시 삭제 모드 해제
  const handlePaneClick = useCallback(() => {
    if (deleteMode) setDeleteMode(false);
  }, [deleteMode, setDeleteMode]);

  // ─── FAB / 키보드 ──────────────────────────────────────────────────────────

  const handleFabClick = useCallback(() => {
    const position = screenToFlowPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
    addRootNode(position);
  }, [screenToFlowPosition, addRootNode]);

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
          addChildNode(parentNode, { x: selectedNode.position.x, y: selectedNode.position.y + 60 });
        } else {
          addRootNode(screenToFlowPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 }));
        }
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        deleteNode(selectedNode.id);
      } else if (e.key === 'Escape' && deleteMode) {
        setDeleteMode(false);
      }
    },
    [nodes, addChildNode, addRootNode, deleteNode, deleteMode, setDeleteMode, screenToFlowPosition],
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
        onNodeDrag={handleNodeDrag}
        onNodeDragStop={handleNodeDragStop}
        onPaneClick={handlePaneClick}
        panOnScroll={false}
        zoomOnPinch
        fitView
      >
        <Controls showInteractive={false} />

        {/* 좌상단: 뒤로가기 + 맵 제목 */}
        <Panel position="top-left" className="editorHeader">
          {onBack && (
            <button className="backBtn" onClick={onBack}>← 목록</button>
          )}
          <div className="editorTitleWrap">
            {editingTitle ? (
              <input
                className="editorTitleInput"
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                onBlur={handleTitleSave}
                onKeyDown={(e) => { if (e.key === 'Enter') handleTitleSave(); if (e.key === 'Escape') setEditingTitle(false); }}
                autoFocus
              />
            ) : (
              <span
                className="editorTitle"
                title="길게 눌러 제목 수정"
                onPointerDown={handleTitlePointerDown}
                onPointerUp={handleTitlePointerUp}
                onPointerLeave={handleTitlePointerUp}
              >
                {mapTitle || 'Untitled'}
              </span>
            )}
          </div>
        </Panel>

        {/* 우상단: 저장 상태 */}
        {saveStatus !== 'idle' && (
          <Panel position="top-right">
            <span className={`saveStatus saveStatus--${saveStatus}`}>
              {SAVE_STATUS_LABEL[saveStatus]}
            </span>
          </Panel>
        )}
      </ReactFlow>

      {/* FAB (삭제 모드가 아닐 때만) */}
      {!deleteMode && (
        <button className="fab" onClick={handleFabClick} aria-label="새 노드 추가">+</button>
      )}

      {/* 휴지통 삭제 영역 */}
      {deleteMode && (
        <div
          ref={trashRef}
          className={`trashZone${trashHovered ? ' trashZone--hover' : ''}`}
          aria-label="이 영역으로 드래그하여 삭제"
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
            <path d="M10 11v6M14 11v6" />
            <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
          </svg>
          <span className="trashLabel">놓아서 삭제</span>
        </div>
      )}
    </div>
  );
}
