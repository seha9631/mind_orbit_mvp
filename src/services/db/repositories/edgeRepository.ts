import { getDB } from '../client';
import type { EdgeRecord } from '../schema';

export const edgeRepository = {
  async getByMapId(mapId: string): Promise<EdgeRecord[]> {
    const db = await getDB();
    return db.getAllFromIndex('edges', 'by-mapId', mapId);
  },

  // 해당 맵의 에지를 전부 교체한다 (삭제 후 삽입을 단일 트랜잭션으로 처리)
  async replaceAll(mapId: string, edges: EdgeRecord[]): Promise<void> {
    const db = await getDB();
    const tx = db.transaction('edges', 'readwrite');
    const existingKeys = await tx.store.index('by-mapId').getAllKeys(mapId);
    await Promise.all(existingKeys.map((key) => tx.store.delete(key)));
    await Promise.all(edges.map((edge) => tx.store.put(edge)));
    await tx.done;
  },

  async delete(id: string): Promise<void> {
    const db = await getDB();
    await db.delete('edges', id);
  },

  async deleteByMapId(mapId: string): Promise<void> {
    const db = await getDB();
    const tx = db.transaction('edges', 'readwrite');
    const keys = await tx.store.index('by-mapId').getAllKeys(mapId);
    await Promise.all(keys.map((key) => tx.store.delete(key)));
    await tx.done;
  },
};
