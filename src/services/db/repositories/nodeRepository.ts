import { getDB } from '../client';
import type { NodeRecord } from '../schema';

export const nodeRepository = {
  async getByMapId(mapId: string): Promise<NodeRecord[]> {
    const db = await getDB();
    return db.getAllFromIndex('nodes', 'by-mapId', mapId);
  },

  // 해당 맵의 노드를 전부 교체한다 (삭제 후 삽입을 단일 트랜잭션으로 처리)
  async replaceAll(mapId: string, nodes: NodeRecord[]): Promise<void> {
    const db = await getDB();
    const tx = db.transaction('nodes', 'readwrite');
    const existingKeys = await tx.store.index('by-mapId').getAllKeys(mapId);
    await Promise.all(existingKeys.map((key) => tx.store.delete(key)));
    await Promise.all(nodes.map((node) => tx.store.put(node)));
    await tx.done;
  },

  async delete(id: string): Promise<void> {
    const db = await getDB();
    await db.delete('nodes', id);
  },

  async deleteByMapId(mapId: string): Promise<void> {
    const db = await getDB();
    const tx = db.transaction('nodes', 'readwrite');
    const keys = await tx.store.index('by-mapId').getAllKeys(mapId);
    await Promise.all(keys.map((key) => tx.store.delete(key)));
    await tx.done;
  },
};
