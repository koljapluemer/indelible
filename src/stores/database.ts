import Dexie, { type EntityTable } from 'dexie'

export interface Canvas {
  id?: string
  slug: string
  createdAt: number
  updatedAt: number
}

export interface CanvasElement {
  id?: string
  canvasId: string
  type: 'text' | 'image' | 'line' | 'tape' | 'drawing'
  x: number
  y: number
  data: string // For drawings: JSON.stringify([{x: number, y: number}])
  scale: number
  width?: number  // Only used for images
  height?: number // Only used for images
  endX?: number   // Only used for lines and tape
  endY?: number   // Only used for lines and tape
  timestamp: number
}

const db = new Dexie('IndelibleDB') as Dexie & {
  canvases: EntityTable<Canvas, 'id'>
  canvasElements: EntityTable<CanvasElement, 'id'>
}

db.version(5).stores({
  canvases: '@id, slug, createdAt, updatedAt',
  canvasElements: '@id, canvasId, type, x, y, data, scale, width, height, endX, endY, timestamp'
})

// v6: switch from outbound auto-increment (@id) to inbound manual UUID (id).
// Fresh DBs (e.g. anonymous windows) created at v5 had integer auto-increment keys;
// the old stores are deleted and recreated correctly. Existing DBs whose stores were
// originally created before @id was introduced already have inbound UUID keys, so
// Dexie just updates indexes and all data is preserved.
db.version(6).stores({
  canvases: 'id, slug, createdAt, updatedAt',
  canvasElements: 'id, canvasId, type, x, y, data, scale, width, height, endX, endY, timestamp'
})

export { db }
