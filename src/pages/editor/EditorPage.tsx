import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ReactFlowProvider } from '@xyflow/react';
import MindMapCanvas from './components/MindMapCanvas';
import useStore from './model/store';

export default function EditorPage() {
  const { mapId } = useParams<{ mapId: string }>();
  const navigate = useNavigate();
  const setMapId = useStore((s) => s.setMapId);

  useEffect(() => {
    if (!mapId) {
      navigate('/', { replace: true });
      return;
    }
    setMapId(mapId);
  }, [mapId, setMapId, navigate]);

  return (
    <ReactFlowProvider>
      <MindMapCanvas onBack={() => navigate('/')} />
    </ReactFlowProvider>
  );
}
