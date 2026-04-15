import { useRef, useEffect, useLayoutEffect } from 'react';
import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';

import useStore from '../model/store';

export type NodeData = {
  label: string;
};

function MindMapNode({ id, data, selected }: NodeProps<Node<NodeData>>) {
  const inputRef = useRef<HTMLInputElement>(null);
  const updateNodeLabel = useStore((state) => state.updateNodeLabel);
  const deleteNode = useStore((state) => state.deleteNode);

  useLayoutEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.width = `${data.label.length * 8}px`;
    }
  }, [data.label.length]);

  useEffect(() => {
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus({ preventScroll: true });
      }
    }, 1);
  }, []);

  return (
    <>
      <div className="inputWrapper">
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
        {selected && (
          <button
            className="deleteBtn"
            onClick={(e) => { e.stopPropagation(); deleteNode(id); }}
            onMouseDown={(e) => e.stopPropagation()}
            title="노드 삭제"
          >
            ×
          </button>
        )}
      </div>

      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Top} />
    </>
  );
}

export default MindMapNode;
