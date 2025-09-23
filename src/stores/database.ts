import Dexie, { type EntityTable } from 'dexie'

export interface TextElement {
  id?: number
  x: number
  y: number
  content: string
  timestamp: number
}

const db = new Dexie('IndelibleDB') as Dexie & {
  textElements: EntityTable<TextElement, 'id'>
}

db.version(1).stores({
  textElements: '++id, x, y, content, timestamp'
})

export { db }