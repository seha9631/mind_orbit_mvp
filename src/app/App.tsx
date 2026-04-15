import './App.css';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import DashboardPage from '../pages/dashboard/DashboardPage';
import EditorPage from '../pages/editor/EditorPage';

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/editor/:mapId" element={<EditorPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
