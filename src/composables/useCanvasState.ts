import { ref, computed } from 'vue'

// Main canvas state machine
type CanvasTool = 'pan' | 'text' | 'image' | 'line'
type CanvasState = 'idle' | 'text-input' | 'image-workflow' | 'line-drawing'

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

interface LineWorkflow {
  isActive: boolean
  startX: number
  startY: number
  endX: number
  endY: number
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

const lineWorkflow = ref<LineWorkflow>({
  isActive: false,
  startX: 0,
  startY: 0,
  endX: 0,
  endY: 0
})

export function useCanvasState() {
  const setTool = (tool: CanvasTool) => {
    // Reset any active workflows when switching tools
    if (tool !== 'image') {
      imageWorkflow.value.isActive = false
    }
    if (tool !== 'line') {
      lineWorkflow.value.isActive = false
    }
    if (tool !== 'image' && tool !== 'line') {
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

  const startLineDrawing = (startX: number, startY: number) => {
    canvasState.value = 'line-drawing'
    lineWorkflow.value = {
      isActive: true,
      startX,
      startY,
      endX: startX,
      endY: startY
    }
  }

  const updateLineEnd = (endX: number, endY: number) => {
    if (lineWorkflow.value.isActive) {
      lineWorkflow.value.endX = endX
      lineWorkflow.value.endY = endY
    }
  }

  const finishLineDrawing = () => {
    lineWorkflow.value.isActive = false
    canvasState.value = 'idle'
  }

  const cancelLineDrawing = () => {
    lineWorkflow.value.isActive = false
    canvasState.value = 'idle'
  }

  return {
    // State
    currentTool: computed(() => currentTool.value),
    canvasState: computed(() => canvasState.value),
    imageWorkflow: computed(() => imageWorkflow.value),
    lineWorkflow: computed(() => lineWorkflow.value),

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

    // Line workflow sub-state machine
    startLineDrawing,
    updateLineEnd,
    finishLineDrawing,
    cancelLineDrawing,

    // Computed state checks
    isImageWorkflowActive: computed(() => imageWorkflow.value.isActive),
    isInSizeSelection: computed(() => imageWorkflow.value.isActive && imageWorkflow.value.state === 'size-selection'),
    isInPositioning: computed(() => imageWorkflow.value.isActive && imageWorkflow.value.state === 'positioning'),
    isLineDrawingActive: computed(() => lineWorkflow.value.isActive),
    canHandleCanvasClick: computed(() =>
      canvasState.value === 'idle' ||
      canvasState.value === 'image-workflow' ||
      canvasState.value === 'line-drawing'
    )
  }
}