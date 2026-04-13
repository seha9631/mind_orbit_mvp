import { openDB, type IDBPDatabase } from 'idb';
import { DB_NAME, DB_VERSION, type MindOrbitDB } from './schema';
import { runMigrations } from './migrations';

let dbInstance: IDBPDatabase<MindOrbitDB> | null = null;

export async function getDB(): Promise<IDBPDatabase<MindOrbitDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<MindOrbitDB>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, newVersion, transaction) {
      runMigrations(db, oldVersion, newVersion ?? DB_VERSION, transaction);
    },
    blocked() {
      // 구 버전 탭이 열려 있어 업그레이드가 블록된 경우
      console.warn('[DB] 다른 탭에서 이전 버전의 DB를 사용 중입니다. 해당 탭을 닫아주세요.');
    },
    blocking() {
      // 이 탭이 다른 탭의 업그레이드를 막고 있는 경우 연결을 해제한다
      dbInstance?.close();
      dbInstance = null;
    },
  });

  return dbInstance;
}
