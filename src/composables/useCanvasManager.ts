import { ref, computed } from 'vue'
import { db, type Canvas, type TextElement } from '../stores/database'

const currentCanvas = ref<Canvas | null>(null)
const canvases = ref<Canvas[]>([])
const textElements = ref<TextElement[]>([])

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
        textElements.value = await db.textElements.where('canvasId').equals(canvas.id).toArray()
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
      canvas.id = id

      currentCanvas.value = canvas
      textElements.value = []
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

  const deleteCanvas = async (canvasId: number): Promise<boolean> => {
    try {
      // Delete all text elements for this canvas
      await db.textElements.where('canvasId').equals(canvasId).delete()

      // Delete the canvas
      await db.canvases.delete(canvasId)

      // If this was the current canvas, clear it
      if (currentCanvas.value?.id === canvasId) {
        currentCanvas.value = null
        textElements.value = []

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
    if (!currentCanvas.value) return false

    try {
      if (!currentCanvas.value.id) return false

      const textElement: TextElement = {
        canvasId: currentCanvas.value.id,
        x,
        y,
        content,
        timestamp: Date.now()
      }

      const id = await db.textElements.add(textElement)
      textElement.id = id
      textElements.value.push(textElement)

      // Update canvas timestamp
      if (currentCanvas.value.id) {
        await db.canvases.update(currentCanvas.value.id, { updatedAt: Date.now() })
        currentCanvas.value.updatedAt = Date.now()
      }

      return true
    } catch (error) {
      console.error('Failed to add text element:', error)
      return false
    }
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
    textElements: computed(() => textElements.value),

    // Methods
    isValidSlug,
    loadCanvases,
    loadCanvas,
    createCanvas,
    switchCanvas,
    deleteCanvas,
    addTextElement,
    initializeFromUrl
  }
}