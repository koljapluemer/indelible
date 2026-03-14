import { ref, computed } from 'vue'
import { db, type Canvas, type CanvasElement } from '../stores/database'

const currentCanvas = ref<Canvas | null>(null)
const canvases = ref<Canvas[]>([])
const elements = ref<CanvasElement[]>([])

export function useCanvasManager() {
  const isValidSlug = (slug: string): boolean => {
    return /^[a-zA-Z0-9-]+$/.test(slug) && slug.length > 0
  }

  const getCanvasFromUrl = (): string | null => {
    const params = new URLSearchParams(window.location.search)
    return params.get('canvas')
  }

  const setCanvasInUrl = (slug: string) => {
    const url = new URL(window.location.href)
    url.searchParams.set('canvas', slug)
    window.history.pushState({}, '', url.toString())
  }

  const loadCanvases = async () => {
    try {
      canvases.value = await db.canvases.orderBy('updatedAt').reverse().toArray()
    } catch (error) {
      console.error('Failed to load canvases:', error)
    }
  }

  const loadCanvas = async (slug: string): Promise<boolean> => {
    try {
      const canvas = await db.canvases.where('slug').equals(slug).first()
      if (!canvas) return false

      currentCanvas.value = canvas
      if (canvas.id) {
        elements.value = await db.canvasElements.where('canvasId').equals(canvas.id).toArray()
      }
      setCanvasInUrl(slug)
      return true
    } catch (error) {
      console.error('Failed to load canvas:', error)
      return false
    }
  }

  const createCanvas = async (slug: string): Promise<boolean> => {
    if (!isValidSlug(slug)) return false

    try {
      // Check if slug already exists
      const existing = await db.canvases.where('slug').equals(slug).first()
      if (existing) return false

      const now = Date.now()
      const canvas: Canvas = {
        slug,
        createdAt: now,
        updatedAt: now
      }

      const id = await db.canvases.add(canvas)
      canvas.id = id as string

      currentCanvas.value = canvas
      elements.value = []
      setCanvasInUrl(slug)
      await loadCanvases()
      return true
    } catch (error) {
      console.error('Failed to create canvas:', error)
      return false
    }
  }

  const switchCanvas = async (slug: string): Promise<boolean> => {
    return await loadCanvas(slug)
  }

  const deleteCanvas = async (canvasId: string): Promise<boolean> => {
    try {
      // Delete all elements for this canvas
      await db.canvasElements.where('canvasId').equals(canvasId).delete()

      // Delete the canvas
      await db.canvases.delete(canvasId)

      // If this was the current canvas, clear it
      if (currentCanvas.value?.id === canvasId) {
        currentCanvas.value = null
        elements.value = []

        // Try to load the first available canvas
        await loadCanvases()
        if (canvases.value.length > 0 && canvases.value[0]) {
          await loadCanvas(canvases.value[0].slug)
        } else {
          // Clear URL if no canvases left
          const url = new URL(window.location.href)
          url.searchParams.delete('canvas')
          window.history.pushState({}, '', url.toString())
        }
      } else {
        await loadCanvases()
      }

      return true
    } catch (error) {
      console.error('Failed to delete canvas:', error)
      return false
    }
  }

  const addTextElement = async (x: number, y: number, content: string): Promise<boolean> => {
    if (!currentCanvas.value?.id) return false

    try {
      const element: CanvasElement = {
        canvasId: currentCanvas.value.id,
        type: 'text',
        x,
        y,
        data: content,
        scale: 1,
        timestamp: Date.now()
      }

      const id = await db.canvasElements.add(element)
      element.id = id
      elements.value.push(element)

      // Update canvas timestamp
      await db.canvases.update(currentCanvas.value.id, { updatedAt: Date.now() })
      currentCanvas.value.updatedAt = Date.now()

      return true
    } catch (error) {
      console.error('Failed to add text element:', error)
      return false
    }
  }

  const addImageElement = async (x: number, y: number, data: string, width: number, height: number, scale: number): Promise<boolean> => {
    if (!currentCanvas.value?.id) return false

    try {
      const element: CanvasElement = {
        canvasId: currentCanvas.value.id,
        type: 'image',
        x,
        y,
        data,
        scale,
        width,
        height,
        timestamp: Date.now()
      }

      const id = await db.canvasElements.add(element)
      element.id = id
      elements.value.push(element)

      // Update canvas timestamp
      await db.canvases.update(currentCanvas.value.id, { updatedAt: Date.now() })
      currentCanvas.value.updatedAt = Date.now()

      return true
    } catch (error) {
      console.error('Failed to add image element:', error)
      return false
    }
  }

  const addDrawingElement = async (type: 'line' | 'tape' | 'drawing', startX: number, startY: number, endX: number, endY: number): Promise<boolean> => {
    if (!currentCanvas.value?.id) return false

    try {
      const element: CanvasElement = {
        canvasId: currentCanvas.value.id,
        type,
        x: startX,
        y: startY,
        endX,
        endY,
        data: '', // Drawing elements don't need data
        scale: 1,
        timestamp: Date.now()
      }

      const id = await db.canvasElements.add(element)
      element.id = id
      elements.value.push(element)

      // Update canvas timestamp
      await db.canvases.update(currentCanvas.value.id, { updatedAt: Date.now() })
      currentCanvas.value.updatedAt = Date.now()

      return true
    } catch (error) {
      console.error(`Failed to add ${type} element:`, error)
      return false
    }
  }

  // Backward compatibility
  const addLineElement = async (startX: number, startY: number, endX: number, endY: number): Promise<boolean> => {
    return addDrawingElement('line', startX, startY, endX, endY)
  }

  const addFreeDrawingElement = async (path: { x: number; y: number }[]): Promise<boolean> => {
    if (!currentCanvas.value?.id || path.length < 2) return false

    const [firstPoint] = path
    if (!firstPoint) return false

    try {
      const element: CanvasElement = {
        canvasId: currentCanvas.value.id,
        type: 'drawing',
        x: firstPoint.x,
        y: firstPoint.y,
        data: JSON.stringify(path),
        scale: 1,
        timestamp: Date.now()
      }

      const id = await db.canvasElements.add(element)
      element.id = id
      elements.value.push(element)

      // Update canvas timestamp
      await db.canvases.update(currentCanvas.value.id, { updatedAt: Date.now() })
      currentCanvas.value.updatedAt = Date.now()

      return true
    } catch (error) {
      console.error('Failed to add drawing element:', error)
      return false
    }
  }

  const exportCurrentCanvas = async (): Promise<void> => {
    if (!currentCanvas.value?.id) return

    const canvasElements = await db.canvasElements.where('canvasId').equals(currentCanvas.value.id).toArray()
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      canvases: [
        {
          slug: currentCanvas.value.slug,
          createdAt: currentCanvas.value.createdAt,
          updatedAt: currentCanvas.value.updatedAt,
          elements: canvasElements.map(({ id: _id, canvasId: _cid, ...rest }) => rest)
        }
      ]
    }

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${currentCanvas.value.slug}.indelible.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportAllCanvases = async (): Promise<void> => {
    const allCanvases = await db.canvases.toArray()
    const canvasesWithElements = await Promise.all(
      allCanvases.map(async (canvas) => {
        const canvasElements = canvas.id
          ? await db.canvasElements.where('canvasId').equals(canvas.id).toArray()
          : []
        return {
          slug: canvas.slug,
          createdAt: canvas.createdAt,
          updatedAt: canvas.updatedAt,
          elements: canvasElements.map(({ id: _id, canvasId: _cid, ...rest }) => rest)
        }
      })
    )

    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      canvases: canvasesWithElements
    }

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'indelible-export.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const importCanvases = async (file: File): Promise<{ imported: number; errors: string[] }> => {
    const errors: string[] = []
    let imported = 0

    try {
      const text = await file.text()
      const data = JSON.parse(text)

      if (data.version !== 1 || !Array.isArray(data.canvases)) {
        return { imported: 0, errors: ['Invalid file format'] }
      }

      for (const canvasData of data.canvases) {
        try {
          const now = Date.now()
          const existing = await db.canvases.where('slug').equals(canvasData.slug).first()

          let canvasId: string
          if (existing?.id) {
            canvasId = existing.id
            await db.canvasElements.where('canvasId').equals(canvasId).delete()
            await db.canvases.update(canvasId, { updatedAt: now })
          } else {
            canvasId = (await db.canvases.add({
              slug: canvasData.slug,
              createdAt: canvasData.createdAt ?? now,
              updatedAt: now
            })) as string
          }

          if (Array.isArray(canvasData.elements)) {
            await db.canvasElements.bulkAdd(
              canvasData.elements.map((el: Omit<CanvasElement, 'id' | 'canvasId'>) => ({
                ...el,
                canvasId
              }))
            )
          }

          imported++
        } catch (err) {
          errors.push(`Failed to import canvas "${canvasData.slug}": ${err}`)
        }
      }

      await loadCanvases()
    } catch (err) {
      return { imported: 0, errors: [`Failed to parse file: ${err}`] }
    }

    return { imported, errors }
  }

  const initializeFromUrl = async (): Promise<boolean> => {
    await loadCanvases()

    const urlSlug = getCanvasFromUrl()
    if (urlSlug) {
      const loaded = await loadCanvas(urlSlug)
      if (loaded) return true
    }

    // No valid canvas from URL, try to load the first available canvas
    if (canvases.value.length > 0 && canvases.value[0]) {
      return await loadCanvas(canvases.value[0].slug)
    }

    return false
  }

  return {
    // State
    currentCanvas: computed(() => currentCanvas.value),
    canvases: computed(() => canvases.value),
    elements: computed(() => elements.value),

    // Methods
    isValidSlug,
    loadCanvases,
    loadCanvas,
    createCanvas,
    switchCanvas,
    deleteCanvas,
    addTextElement,
    addImageElement,
    addDrawingElement,
    addLineElement,
    addFreeDrawingElement,
    initializeFromUrl,
    exportCurrentCanvas,
    exportAllCanvases,
    importCanvases
  }
}