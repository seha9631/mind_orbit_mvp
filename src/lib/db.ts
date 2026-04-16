import { openDB } from 'idb'

import type { AppMetaRecord, MindMapRecord } from '../types/mindmap'

const DB_NAME = 'mind-orbit-mvp'
const DB_VERSION = 1
const META_KEY = 'app-state'

type MindOrbitDB = {
  maps: MindMapRecord
  meta: AppMetaRecord
}

const dbPromise = openDB<MindOrbitDB>(DB_NAME, DB_VERSION, {
  upgrade(db) {
    if (!db.objectStoreNames.contains('maps')) {
      db.createObjectStore('maps', { keyPath: 'id' })
    }

    if (!db.objectStoreNames.contains('meta')) {
      db.createObjectStore('meta', { keyPath: 'key' })
    }
  },
})

export async function listMindMaps() {
  const db = await dbPromise
  const maps = await db.getAll('maps')

  return maps.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
}

export async function getMindMap(id: string) {
  const db = await dbPromise
  return db.get('maps', id)
}

export async function saveMindMap(map: MindMapRecord) {
  const db = await dbPromise
  await db.put('maps', map)
  return map
}

export async function deleteMindMap(id: string) {
  const db = await dbPromise
  await db.delete('maps', id)
}

export async function toggleMindMapFavorite(id: string) {
  const db = await dbPromise
  const map = await db.get('maps', id)
  if (!map) return
  await db.put('maps', { ...map, isFavorite: !map.isFavorite })
}

export async function getAppMeta() {
  const db = await dbPromise
  return db.get('meta', META_KEY)
}

export async function saveAppMeta(partial: Partial<Omit<AppMetaRecord, 'key'>>) {
  const db = await dbPromise
  const current =
    (await db.get('meta', META_KEY)) ??
    ({
      key: META_KEY,
      lastScreen: 'landing',
    } satisfies AppMetaRecord)

  const next: AppMetaRecord = {
    ...current,
    ...partial,
    key: META_KEY,
  }

  if ('lastOpenedMapId' in partial && partial.lastOpenedMapId === undefined) {
    delete next.lastOpenedMapId
  }

  await db.put('meta', next)
  return next
}
