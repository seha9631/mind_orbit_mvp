import { useRef, useEffect, useLayoutEffect } from 'react';
import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import useStore from '../model/store';

export type NodeData = {
  label: string;
  collapsed?: boolean;
};

// ─── 액션 버튼 아이콘 ────────────────────────────────────────────────────────

function CollapseIcon({ collapsed }: { collapsed?: boolean }) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      {collapsed
        ? <polyline points="9 18 15 12 9 6" />   // 오른쪽 ▶ = 펼치기
        : <polyline points="18 15 12 9 6 15" />  // 위쪽 ▲ = 접기
      }
    </svg>
  );
}

function SiblingIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="9" width="7" height="6" rx="1.5" />
      <rect x="16" y="9" width="7" height="6" rx="1.5" />
      <line x1="8" y1="12" x2="11" y2="12" />
      <line x1="13" y1="12" x2="16" y2="12" />
      <line x1="12" y1="10" x2="12" y2="14" />
    </svg>
  );
}

function ChildIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="8" y="2" width="8" height="6" rx="1.5" />
      <rect x="8" y="16" width="8" height="6" rx="1.5" />
      <line x1="12" y1="8" x2="12" y2="13" />
      <line x1="12" y1="13" x2="14" y2="11" />
      <line x1="12" y1="13" x2="10" y2="11" />
      <line x1="10" y1="16" x2="12" y2="13" />
      <line x1="14" y1="16" x2="12" y2="13" />
    </svg>
  );
}

// ─── 메인 컴포넌트 ────────────────────────────────────────────────────────────

function MindMapNode({ id, data, selected }: NodeProps<Node<NodeData>>) {
  const inputRef = useRef<HTMLInputElement>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout>>();
  const pointerDownPos = useRef({ x: 0, y: 0 });

  const updateNodeLabel = useStore((s) => s.updateNodeLabel);
  const toggleCollapse = useStore((s) => s.toggleCollapse);
  const addSiblingNode = useStore((s) => s.addSiblingNode);
  const addChildToNode = useStore((s) => s.addChildToNode);
  const deleteMode = useStore((s) => s.deleteMode);
  const setDeleteMode = useStore((s) => s.setDeleteMode);

  useLayoutEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.width = `${Math.max(data.label.length * 8, 40)}px`;
    }
  }, [data.label.length]);

  useEffect(() => {
    setTimeout(() => {
      inputRef.current?.focus({ preventScroll: true });
    }, 1);
  }, []);

  // 꾹 누르기 → 삭제 모드 진입
  const handlePointerDown = (e: React.PointerEvent) => {
    pointerDownPos.current = { x: e.clientX, y: e.clientY };
    longPressTimer.current = setTimeout(() => {
      setDeleteMode(true);
    }, 600);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const dx = Math.abs(e.clientX - pointerDownPos.current.x);
    const dy = Math.abs(e.clientY - pointerDownPos.current.y);
    if (dx > 8 || dy > 8) clearTimeout(longPressTimer.current);
  };

  const handlePointerUp = () => clearTimeout(longPressTimer.current);

  const hasChildren = useStore((s) => s.nodes.some((n) => n.parentId === id));

  return (
    <>
      {/* 선택 시 액션 버튼 툴바 (삭제 모드가 아닐 때) */}
      {selected && !deleteMode && (
        <div className="nodeActions">
          {hasChildren && (
            <button
              className="nodeAction"
              title={data.collapsed ? '펼치기' : '접기'}
              onMouseDown={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); toggleCollapse(id); }}
            >
              <CollapseIcon collapsed={data.collapsed} />
            </button>
          )}
          <button
            className="nodeAction"
            title="형제 노드 추가"
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); addSiblingNode(id); }}
          >
            <SiblingIcon />
          </button>
          <button
            className="nodeAction"
            title="자식 노드 추가"
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); addChildToNode(id); }}
          >
            <ChildIcon />
          </button>
        </div>
      )}

      <div
        className={`inputWrapper${deleteMode ? ' inputWrapper--deleteMode' : ''}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <div className="dragHandle">
          <svg viewBox="0 0 24 24">
            <path
              fill="#333"
              stroke="#333"
              strokeWidth="1"
              d="M15 5h2V3h-2v2zM7 5h2V3H7v2zm8 8h2v-2h-2v2zm-8 0h2v-2H7v2zm8 8h2v-2h-2v2zm-8 0h2v-2H7v2z"
            />
          </svg>
        </div>
        <input
          value={data.label}
          onChange={(evt) => updateNodeLabel(id, evt.target.value)}
          className="input"
          ref={inputRef}
        />
        {/* 접힌 상태 뱃지 */}
        {data.collapsed && (
          <span className="collapsedBadge" title="접혀 있음">▸</span>
        )}
      </div>

      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Top} />
    </>
  );
}

export default MindMapNode;
