import { getDB } from '../client';
import type { MapRecord } from '../schema';
import { nodeRepository } from './nodeRepository';
import { edgeRepository } from './edgeRepository';
import { nanoid } from 'nanoid/non-secure';

export const mapRepository = {
  /** updatedAt 내림차순(최신순)으로 전체 맵 반환 */
  async getAll(): Promise<MapRecord[]> {
    const db = await getDB();
    const all = await db.getAllFromIndex('maps', 'by-updatedAt');
    return all.reverse();
  },

  async getById(id: string): Promise<MapRecord | undefined> {
    const db = await getDB();
    return db.get('maps', id);
  },

  async create(title: string): Promise<MapRecord> {
    const db = await getDB();
    const now = Date.now();
    const record: MapRecord = {
      id: nanoid(),
      title,
      createdAt: now,
      updatedAt: now,
    };
    await db.put('maps', record);
    return record;
  },

  async update(
    id: string,
    patch: Partial<Pick<MapRecord, 'title' | 'favorite' | 'updatedAt'>>,
  ): Promise<void> {
    const db = await getDB();
    const existing = await db.get('maps', id);
    if (!existing) return;
    await db.put('maps', { ...existing, ...patch });
  },

  /** 연관된 nodes/edges를 cascade 삭제 후 맵 삭제 */
  async delete(id: string): Promise<void> {
    await Promise.all([
      nodeRepository.deleteByMapId(id),
      edgeRepository.deleteByMapId(id),
    ]);
    const db = await getDB();
    await db.delete('maps', id);
  },
};
