export type DeviceClass = 'mobile' | 'tablet' | 'desktop'

export type ActiveSheet = 'none' | 'create-map' | 'style' | 'more'

export type AppScreenName = 'landing' | 'dashboard' | 'editor'

export interface NodeSize {
  width: number
  height: number
}

export interface MindMapNodeRecord {
  id: string
  parentId: string | null
  text: string
  position: {
    x: number
    y: number
  }
  size?: NodeSize
}

export interface ViewportState {
  x: number
  y: number
  zoom: number
}

export interface MindMapRecord {
  id: string
  title: string
  createdAt: string
  updatedAt: string
  rootNodeId: string
  nodes: MindMapNodeRecord[]
  viewport: ViewportState
}

export interface AppMetaRecord {
  key: 'app-state'
  lastOpenedMapId?: string
  lastScreen: AppScreenName
  lastDeviceClass?: DeviceClass
}
