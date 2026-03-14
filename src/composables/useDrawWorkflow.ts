import { ref, computed } from 'vue'
import { useCanvasManager } from './useCanvasManager'
import {
  createDrawingWorkflow,
  startDrawing,
  updateDrawingEnd,
  finishDrawing,
  cancelDrawing,
  type DrawingWorkflow,
  type DrawingElement,
} from '../utils/drawingUtils'

interface FreeDrawWorkflow {
  isActive: boolean
  currentPath: { x: number; y: number }[]
}

const lineWorkflow = ref<DrawingWorkflow>(createDrawingWorkflow('line'))
const freeWorkflow = ref<FreeDrawWorkflow>({ isActive: false, currentPath: [] })

export function useDrawWorkflow() {
  const { addDrawingElement, addFreeDrawingElement } = useCanvasManager()

  // Line / tape
  const startLine = (element: DrawingElement, startX: number, startY: number) => {
    lineWorkflow.value = startDrawing(lineWorkflow.value, element, startX, startY)
  }

  const updateLineEnd = (endX: number, endY: number) => {
    if (lineWorkflow.value.isActive) {
      lineWorkflow.value = updateDrawingEnd(lineWorkflow.value, endX, endY)
    }
  }

  const finishLine = async (endX: number, endY: number): Promise<void> => {
    if (!lineWorkflow.value.isActive) return
    const w = lineWorkflow.value
    await addDrawingElement(w.element, w.startX, w.startY, endX, endY)
    lineWorkflow.value = finishDrawing(lineWorkflow.value)
  }

  const cancelLine = () => {
    lineWorkflow.value = cancelDrawing(lineWorkflow.value)
  }

  // Free drawing
  const startFree = (x: number, y: number) => {
    freeWorkflow.value = { isActive: true, currentPath: [{ x, y }] }
  }

  const addPoint = (x: number, y: number) => {
    if (!freeWorkflow.value.isActive) return
    const last = freeWorkflow.value.currentPath[freeWorkflow.value.currentPath.length - 1]
    if (!last || Math.abs(x - last.x) > 2 || Math.abs(y - last.y) > 2) {
      freeWorkflow.value.currentPath.push({ x, y })
    }
  }

  const finishFree = async (): Promise<void> => {
    const path = freeWorkflow.value.currentPath
    if (path.length > 1) {
      await addFreeDrawingElement(path)
    }
    freeWorkflow.value = { isActive: false, currentPath: [] }
  }

  const cancelFree = () => {
    freeWorkflow.value = { isActive: false, currentPath: [] }
  }

  return {
    lineWorkflow: computed(() => lineWorkflow.value),
    freeWorkflow: computed(() => freeWorkflow.value),
    isLineActive: computed(() => lineWorkflow.value.isActive),
    isFreeActive: computed(() => freeWorkflow.value.isActive),
    startLine,
    updateLineEnd,
    finishLine,
    cancelLine,
    startFree,
    addPoint,
    finishFree,
    cancelFree,
  }
}
