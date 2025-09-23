import Dexie, { type EntityTable } from 'dexie'

export interface Canvas {
  id?: number
  slug: string
  createdAt: number
  updatedAt: number
}

export interface TextElement {
  id?: number
  canvasId: number
  x: number
  y: number
  content: string
  timestamp: number
}

const db = new Dexie('IndelibleDB') as Dexie & {
  canvases: EntityTable<Canvas, 'id'>
  textElements: EntityTable<TextElement, 'id'>
}

db.version(1).stores({
  canvases: '++id, slug, createdAt, updatedAt',
  textElements: '++id, canvasId, x, y, content, timestamp'
})

export { db }