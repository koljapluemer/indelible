import { ref, computed } from 'vue'
import { createDrawingWorkflow, startDrawing, updateDrawingEnd, finishDrawing, cancelDrawing, type DrawingWorkflow, type DrawingElement } from '../utils/drawingUtils'

// Main canvas state machine
type CanvasTool = 'pan' | 'text' | 'image' | 'line' | 'tape' | 'draw'
type CanvasState = 'idle' | 'text-input' | 'image-workflow' | 'drawing' | 'free-drawing'

// Image workflow - two step process
type ImageState = 'size-selection' | 'positioning'
type ImageSize = 'small' | 'medium' | 'large'

interface ImageWorkflow {
  isActive: boolean
  state: ImageState
  data: string
  originalWidth: number
  originalHeight: number
  selectedSize: ImageSize | null
  displayWidth: number
  displayHeight: number
  x: number
  y: number
}

// Use the drawing workflow from utils

interface FreeDrawingWorkflow {
  isActive: boolean
  currentPath: { x: number; y: number }[]
}

const currentTool = ref<CanvasTool>('pan')
const canvasState = ref<CanvasState>('idle')
const imageWorkflow = ref<ImageWorkflow>({
  isActive: false,
  state: 'size-selection',
  data: '',
  originalWidth: 0,
  originalHeight: 0,
  selectedSize: null,
  displayWidth: 0,
  displayHeight: 0,
  x: window.innerWidth / 2,
  y: window.innerHeight / 2
})

const drawingWorkflow = ref<DrawingWorkflow>(createDrawingWorkflow('line'))

const freeDrawingWorkflow = ref<FreeDrawingWorkflow>({
  isActive: false,
  currentPath: []
})

export function useCanvasState() {
  const setTool = (tool: CanvasTool) => {
    // Reset any active workflows when switching tools
    if (tool !== 'image') {
      imageWorkflow.value.isActive = false
    }
    if (tool !== 'line' && tool !== 'tape') {
      drawingWorkflow.value = cancelDrawing(drawingWorkflow.value)
    }
    if (tool !== 'draw') {
      freeDrawingWorkflow.value.isActive = false
      freeDrawingWorkflow.value.currentPath = []
    }
    if (tool !== 'image' && tool !== 'line' && tool !== 'tape' && tool !== 'draw') {
      canvasState.value = 'idle'
    }
    currentTool.value = tool
  }

  const startImageWorkflow = (data: string, width: number, height: number) => {
    currentTool.value = 'image'
    canvasState.value = 'image-workflow'

    imageWorkflow.value = {
      isActive: true,
      state: 'size-selection',
      data,
      originalWidth: width,
      originalHeight: height,
      selectedSize: null,
      displayWidth: 0,
      displayHeight: 0,
      x: window.innerWidth / 2,
      y: window.innerHeight / 2
    }
  }

  const selectImageSize = (size: ImageSize) => {
    if (!imageWorkflow.value.isActive) return

    // Calculate display dimensions based on size
    const maxWidths = { small: 200, medium: 400, large: 800 }
    const maxWidth = maxWidths[size]

    const aspectRatio = imageWorkflow.value.originalHeight / imageWorkflow.value.originalWidth
    const displayWidth = Math.min(maxWidth, imageWorkflow.value.originalWidth)
    const displayHeight = displayWidth * aspectRatio

    imageWorkflow.value.selectedSize = size
    imageWorkflow.value.displayWidth = displayWidth
    imageWorkflow.value.displayHeight = displayHeight
    imageWorkflow.value.state = 'positioning'
  }

  const updateImagePosition = (x: number, y: number) => {
    if (imageWorkflow.value.isActive && imageWorkflow.value.state === 'positioning') {
      imageWorkflow.value.x = x
      imageWorkflow.value.y = y
    }
  }

  const cancelImageWorkflow = () => {
    imageWorkflow.value.isActive = false
    canvasState.value = 'idle'
  }

  const finishImageWorkflow = () => {
    imageWorkflow.value.isActive = false
    canvasState.value = 'idle'
  }

  const startTextInput = () => {
    canvasState.value = 'text-input'
  }

  const completeTextInput = () => {
    canvasState.value = 'idle'
  }

  const startElementDrawing = (element: DrawingElement, startX: number, startY: number) => {
    canvasState.value = 'drawing'
    drawingWorkflow.value = startDrawing(drawingWorkflow.value, element, startX, startY)
  }

  const updateDrawingEndPosition = (endX: number, endY: number) => {
    if (drawingWorkflow.value.isActive) {
      drawingWorkflow.value = updateDrawingEnd(drawingWorkflow.value, endX, endY)
    }
  }

  const finishElementDrawing = () => {
    drawingWorkflow.value = finishDrawing(drawingWorkflow.value)
    canvasState.value = 'idle'
  }

  const cancelElementDrawing = () => {
    drawingWorkflow.value = cancelDrawing(drawingWorkflow.value)
    canvasState.value = 'idle'
  }

  const startFreeDrawing = (startX: number, startY: number) => {
    canvasState.value = 'free-drawing'
    freeDrawingWorkflow.value = {
      isActive: true,
      currentPath: [{ x: startX, y: startY }]
    }
  }

  const addPointToDrawing = (x: number, y: number) => {
    if (freeDrawingWorkflow.value.isActive) {
      const lastPoint = freeDrawingWorkflow.value.currentPath[freeDrawingWorkflow.value.currentPath.length - 1]
      // Only add point if it's far enough from the last point (optimization)
      if (!lastPoint || Math.abs(x - lastPoint.x) > 2 || Math.abs(y - lastPoint.y) > 2) {
        freeDrawingWorkflow.value.currentPath.push({ x, y })
      }
    }
  }

  const finishFreeDrawing = () => {
    freeDrawingWorkflow.value.isActive = false
    canvasState.value = 'idle'
  }

  const cancelFreeDrawing = () => {
    freeDrawingWorkflow.value.isActive = false
    freeDrawingWorkflow.value.currentPath = []
    canvasState.value = 'idle'
  }

  return {
    // State
    currentTool: computed(() => currentTool.value),
    canvasState: computed(() => canvasState.value),
    imageWorkflow: computed(() => imageWorkflow.value),
    drawingWorkflow: computed(() => drawingWorkflow.value),
    freeDrawingWorkflow: computed(() => freeDrawingWorkflow.value),

    // Main state machine
    setTool,
    startTextInput,
    completeTextInput,

    // Image workflow sub-state machine
    startImageWorkflow,
    selectImageSize,
    updateImagePosition,
    cancelImageWorkflow,
    finishImageWorkflow,

    // Drawing workflow sub-state machine (line, tape)
    startElementDrawing,
    updateDrawingEndPosition,
    finishElementDrawing,
    cancelElementDrawing,

    // Free drawing workflow sub-state machine
    startFreeDrawing,
    addPointToDrawing,
    finishFreeDrawing,
    cancelFreeDrawing,

    // Computed state checks
    isImageWorkflowActive: computed(() => imageWorkflow.value.isActive),
    isInSizeSelection: computed(() => imageWorkflow.value.isActive && imageWorkflow.value.state === 'size-selection'),
    isInPositioning: computed(() => imageWorkflow.value.isActive && imageWorkflow.value.state === 'positioning'),
    isDrawingActive: computed(() => drawingWorkflow.value.isActive),
    isFreeDrawingActive: computed(() => freeDrawingWorkflow.value.isActive),
    canHandleCanvasClick: computed(() =>
      canvasState.value === 'idle' ||
      canvasState.value === 'image-workflow' ||
      canvasState.value === 'drawing'
    )
  }
}