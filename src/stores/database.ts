import Dexie, { type EntityTable } from 'dexie'
import dexieCloud from 'dexie-cloud-addon'

export interface Canvas {
  id?: string
  slug: string
  createdAt: number
  updatedAt: number
  owner?: string
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

const db = new Dexie('IndelibleDB', { addons: [dexieCloud] }) as Dexie & {
  canvases: EntityTable<Canvas, 'id'>
  canvasElements: EntityTable<CanvasElement, 'id'>
  cloud: {
    configure: (config: { databaseUrl: string; requireAuth: boolean; customLoginGui: boolean }) => void
    login: () => Promise<void>
    logout: () => Promise<void>
    currentUser: { subscribe: (callback: (user: unknown) => void) => { unsubscribe: () => void }; value?: unknown }
    userInteraction: { subscribe: (callback: (interaction: unknown) => void) => { unsubscribe: () => void }; value?: unknown }
    syncState: { subscribe: (callback: (state: unknown) => void) => { unsubscribe: () => void }; value?: unknown }
  }
}

db.version(5).stores({
  canvases: '@id, slug, createdAt, updatedAt',
  canvasElements: '@id, canvasId, type, x, y, data, scale, width, height, endX, endY, timestamp'
})

// Only configure Dexie Cloud if database URL is set
if (import.meta.env.VITE_DEXIE_CLOUD_URL) {
  db.cloud.configure({
    databaseUrl: import.meta.env.VITE_DEXIE_CLOUD_URL,
    requireAuth: false,
    customLoginGui: true
  })
}

export { db }