import Dexie, { type EntityTable } from 'dexie'

export interface Canvas {
  id?: number
  slug: string
  createdAt: number
  updatedAt: number
}

export interface CanvasElement {
  id?: number
  canvasId: number
  type: 'text' | 'image'
  x: number
  y: number
  data: string
  scale: number
  width?: number  // Only used for images
  height?: number // Only used for images
  timestamp: number
}

const db = new Dexie('IndelibleDB') as Dexie & {
  canvases: EntityTable<Canvas, 'id'>
  canvasElements: EntityTable<CanvasElement, 'id'>
}

db.version(2).stores({
  canvases: '++id, slug, createdAt, updatedAt',
  canvasElements: '++id, canvasId, type, x, y, data, scale, width, height, timestamp'
})

export { db }