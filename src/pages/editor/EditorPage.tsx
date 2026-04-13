import { ReactFlowProvider } from '@xyflow/react';
import MindMapCanvas from './components/MindMapCanvas';

export default function EditorPage() {
  return (
    <ReactFlowProvider>
      <MindMapCanvas />
    </ReactFlowProvider>
  );
}