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
  type: 'text' | 'image' | 'line' | 'tape'
  x: number
  y: number
  data: string
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

db.version(4).stores({
  canvases: '++id, slug, createdAt, updatedAt',
  canvasElements: '++id, canvasId, type, x, y, data, scale, width, height, endX, endY, timestamp'
})

export { db }