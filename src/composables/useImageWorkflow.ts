import { ref, computed } from 'vue'
import { useCanvasManager } from './useCanvasManager'
import { processImageFile } from '../utils/imageProcessor'
import { openFileDialog } from '../utils/fileUpload'

type ImageSize = 'small' | 'medium' | 'large'
type ImageState = 'size-selection' | 'positioning'

interface ImageWorkflow {
  isActive: boolean
  state: ImageState
  data: string
  originalWidth: number
  originalHeight: number
  selectedSize: ImageSize | null
  displayWidth: number
  displayHeight: number
  x: number   // canvas coords
  y: number
}

const workflow = ref<ImageWorkflow>({
  isActive: false,
  state: 'size-selection',
  data: '',
  originalWidth: 0,
  originalHeight: 0,
  selectedSize: null,
  displayWidth: 0,
  displayHeight: 0,
  x: 0,
  y: 0,
})

export function useImageWorkflow() {
  const { addImageElement } = useCanvasManager()

  // Opens file dialog, processes image, enters size-selection
  const activate = async (): Promise<boolean> => {
    try {
      const file = await openFileDialog()
      if (!file) return false
      const processed = await processImageFile(file)
      workflow.value = {
        isActive: true,
        state: 'size-selection',
        data: processed.data,
        originalWidth: processed.width,
        originalHeight: processed.height,
        selectedSize: null,
        displayWidth: 0,
        displayHeight: 0,
        x: 0,
        y: 0,
      }
      return true
    } catch {
      return false
    }
  }

  // Also supports starting from already-processed image data (e.g. clipboard paste)
  const activateWithData = (data: string, width: number, height: number) => {
    workflow.value = {
      isActive: true,
      state: 'size-selection',
      data,
      originalWidth: width,
      originalHeight: height,
      selectedSize: null,
      displayWidth: 0,
      displayHeight: 0,
      x: 0,
      y: 0,
    }
  }

  const selectSize = (size: ImageSize) => {
    if (!workflow.value.isActive) return
    const maxWidths = { small: 200, medium: 400, large: 800 }
    const maxWidth = maxWidths[size]
    const displayWidth = Math.round(Math.min(maxWidth, workflow.value.originalWidth))
    const displayHeight = Math.round(displayWidth * (workflow.value.originalHeight / workflow.value.originalWidth))
    workflow.value = { ...workflow.value, selectedSize: size, displayWidth, displayHeight, state: 'positioning' }
  }

  const updatePosition = (canvasX: number, canvasY: number) => {
    if (workflow.value.isActive && workflow.value.state === 'positioning') {
      workflow.value.x = canvasX
      workflow.value.y = canvasY
    }
  }

  const place = async (canvasX: number, canvasY: number): Promise<void> => {
    if (!workflow.value.isActive || workflow.value.state !== 'positioning') return
    await addImageElement(
      canvasX, canvasY,
      workflow.value.data,
      workflow.value.displayWidth,
      workflow.value.displayHeight,
      1
    )
    workflow.value.isActive = false
  }

  const cancel = () => {
    workflow.value.isActive = false
  }

  return {
    workflow: computed(() => workflow.value),
    isActive: computed(() => workflow.value.isActive),
    isInSizeSelection: computed(() => workflow.value.isActive && workflow.value.state === 'size-selection'),
    isInPositioning: computed(() => workflow.value.isActive && workflow.value.state === 'positioning'),
    activate,
    activateWithData,
    selectSize,
    updatePosition,
    place,
    cancel,
  }
}
