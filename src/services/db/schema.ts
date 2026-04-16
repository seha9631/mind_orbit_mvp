import type { DBSchema } from 'idb';

export const DB_NAME = 'mind-orbit';
export const DB_VERSION = 1;

export interface MapRecord {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  favorite?: boolean;
}

export interface NodeRecord {
  id: string;
  mapId: string;
  type: string;
  label: string;
  x: number;
  y: number;
  parentId?: string;
  collapsed?: boolean;
}

export interface EdgeRecord {
  id: string;
  mapId: string;
  source: string;
  target: string;
}

export interface MindOrbitDB extends DBSchema {
  maps: {
    key: string;
    value: MapRecord;
    indexes: { 'by-updatedAt': number };
  };
  nodes: {
    key: string;
    value: NodeRecord;
    indexes: { 'by-mapId': string };
  };
  edges: {
    key: string;
    value: EdgeRecord;
    indexes: { 'by-mapId': string };
  };
}
