import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { MapRecord } from '../../services/db/schema';
import { mapRepository } from '../../services/db/repositories/mapRepository';
import MapCard from './components/MapCard';

type Tab = 'all' | 'favorites' | 'recent';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [maps, setMaps] = useState<MapRecord[]>([]);
  const [tab, setTab] = useState<Tab>('all');

  useEffect(() => {
    mapRepository.getAll().then(setMaps);
  }, []);

  const displayed = useMemo(() => {
    if (tab === 'favorites') return maps.filter((m) => m.favorite);
    if (tab === 'recent') return maps.slice(0, 6);
    return maps;
  }, [maps, tab]);

  const handleCreate = async () => {
    const record = await mapRepository.create('Untitled');
    navigate(`/editor/${record.id}`);
  };

  const handleToggleFavorite = async (id: string, current: boolean) => {
    await mapRepository.update(id, { favorite: !current });
    setMaps((prev) =>
      prev.map((m) => (m.id === id ? { ...m, favorite: !current } : m)),
    );
  };

  const handleCardClick = (id: string) => {
    navigate(`/editor/${id}`);
  };

  return (
    <div className="dashboard">
      {/* 헤더 */}
      <div className="dashboard__header">
        <span className="dashboard__app-name">Mind Orbit</span>
      </div>

      {/* 타이틀 */}
      <div className="dashboard__title-section">
        <h1 className="dashboard__title">My Orbits</h1>
        <p className="dashboard__subtitle">{maps.length} Universes Created</p>
      </div>

      {/* 탭 바 */}
      <div className="dashboard__tabs">
        {(['all', 'favorites', 'recent'] as Tab[]).map((t) => (
          <button
            key={t}
            className={`dashboard__tab ${tab === t ? 'dashboard__tab--active' : ''}`}
            onClick={() => setTab(t)}
          >
            {t === 'all' ? 'All' : t === 'favorites' ? 'Favorites' : 'Recent'}
          </button>
        ))}
      </div>

      {/* 카드 그리드 */}
      {displayed.length === 0 ? (
        <div className="dashboard__empty">
          {tab === 'favorites'
            ? '즐겨찾기한 맵이 없습니다.'
            : '맵이 없습니다. + 버튼으로 새 맵을 만들어보세요.'}
        </div>
      ) : (
        <div className="dashboard__grid">
          {displayed.map((map) => (
            <MapCard
              key={map.id}
              map={map}
              onFavoriteToggle={handleToggleFavorite}
              onClick={handleCardClick}
            />
          ))}
        </div>
      )}

      {/* FAB */}
      <button className="fab dashboard__fab" onClick={handleCreate} aria-label="새 맵 만들기">
        +
      </button>
    </div>
  );
}
