import type { MapRecord } from '../../../services/db/schema';

interface MapCardProps {
  map: MapRecord;
  onFavoriteToggle: (id: string, current: boolean) => void;
  onClick: (id: string) => void;
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// 마인드맵 버블 아이콘 SVG
function BubbleIcon() {
  return (
    <svg width="72" height="56" viewBox="0 0 72 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="36" cy="28" r="14" fill="#d0d4de" />
      <circle cx="16" cy="20" r="9" fill="#dde0e8" />
      <circle cx="56" cy="18" r="7" fill="#dde0e8" />
      <circle cx="22" cy="40" r="6" fill="#e4e7ee" />
      <circle cx="52" cy="38" r="9" fill="#d8dbe6" />
    </svg>
  );
}

function StarIcon({ filled }: { filled: boolean }) {
  return filled ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#f6ad55" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.8" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

export default function MapCard({ map, onFavoriteToggle, onClick }: MapCardProps) {
  return (
    <div className="map-card" onClick={() => onClick(map.id)}>
      <div className="map-card__preview">
        <BubbleIcon />
        <button
          className="map-card__star"
          onClick={(e) => {
            e.stopPropagation();
            onFavoriteToggle(map.id, !!map.favorite);
          }}
          aria-label={map.favorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}
        >
          <StarIcon filled={!!map.favorite} />
        </button>
      </div>
      <div className="map-card__info">
        <div className="map-card__title">{map.title}</div>
        <div className="map-card__date">{formatDate(map.updatedAt)}</div>
      </div>
    </div>
  );
}
