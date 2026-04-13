import type { IDBPDatabase, IDBPTransaction } from 'idb';
import type { MindOrbitDB } from './schema';

type UpgradeDB = IDBPDatabase<MindOrbitDB>;
type UpgradeTx = IDBPTransaction<MindOrbitDB, (keyof MindOrbitDB)[], 'versionchange'>;

// migrations[i] 는 버전 i → i+1 마이그레이션 함수
// DB_VERSION 을 올릴 때마다 이 배열에 추가한다
const migrations: Array<(db: UpgradeDB, tx: UpgradeTx) => void> = [
  // v0 → v1: 초기 스키마 생성
  (db) => {
    const mapStore = db.createObjectStore('maps', { keyPath: 'id' });
    mapStore.createIndex('by-updatedAt', 'updatedAt');

    const nodeStore = db.createObjectStore('nodes', { keyPath: 'id' });
    nodeStore.createIndex('by-mapId', 'mapId');

    const edgeStore = db.createObjectStore('edges', { keyPath: 'id' });
    edgeStore.createIndex('by-mapId', 'mapId');
  },
];

export function runMigrations(
  db: UpgradeDB,
  oldVersion: number,
  newVersion: number,
  tx: UpgradeTx,
) {
  for (let v = oldVersion; v < newVersion; v++) {
    migrations[v]?.(db, tx);
  }
}
