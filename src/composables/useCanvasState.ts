import { ref, computed } from 'vue'
import { useImageWorkflow } from './useImageWorkflow'
import { useDrawWorkflow } from './useDrawWorkflow'

type CanvasTool = 'pan' | 'text' | 'image' | 'line' | 'tape' | 'draw'
type CanvasState = 'idle' | 'text-input' | 'image-workflow' | 'drawing' | 'free-drawing'

const currentTool = ref<CanvasTool>('pan')
const canvasState = ref<CanvasState>('idle')

export function useCanvasState() {
  const imageWorkflow = useImageWorkflow()
  const drawWorkflow = useDrawWorkflow()

  const setTool = (tool: CanvasTool) => {
    if (tool !== 'image') imageWorkflow.cancel()
    if (tool !== 'line' && tool !== 'tape') drawWorkflow.cancelLine()
    if (tool !== 'draw') drawWorkflow.cancelFree()
    if (!['image', 'line', 'tape', 'draw'].includes(tool)) canvasState.value = 'idle'
    currentTool.value = tool
  }

  // Text
  const startTextInput = () => { canvasState.value = 'text-input' }
  const completeTextInput = () => { canvasState.value = 'idle' }

  // Image — delegates to useImageWorkflow; keeps canvasState in sync
  const startImageWorkflow = (data: string, width: number, height: number) => {
    currentTool.value = 'image'
    canvasState.value = 'image-workflow'
    imageWorkflow.activateWithData(data, width, height)
  }
  const selectImageSize = (size: 'small' | 'medium' | 'large') => {
    imageWorkflow.selectSize(size)
  }
  const updateImagePosition = (canvasX: number, canvasY: number) => {
    imageWorkflow.updatePosition(canvasX, canvasY)
  }
  const cancelImageWorkflow = () => {
    imageWorkflow.cancel()
    canvasState.value = 'idle'
  }
  const finishImageWorkflow = () => {
    imageWorkflow.cancel()
    canvasState.value = 'idle'
  }

  // Drawing (line/tape) — delegates to useDrawWorkflow
  const startElementDrawing = (element: 'line' | 'tape', startX: number, startY: number) => {
    canvasState.value = 'drawing'
    drawWorkflow.startLine(element, startX, startY)
  }
  const updateDrawingEndPosition = (endX: number, endY: number) => {
    drawWorkflow.updateLineEnd(endX, endY)
  }
  const finishElementDrawing = () => {
    canvasState.value = 'idle'
    // actual DB write triggered by App.vue via handleFinishDrawing
  }
  const cancelElementDrawing = () => {
    drawWorkflow.cancelLine()
    canvasState.value = 'idle'
  }

  // Free drawing — delegates to useDrawWorkflow
  const startFreeDrawing = (x: number, y: number) => {
    canvasState.value = 'free-drawing'
    drawWorkflow.startFree(x, y)
  }
  const addPointToDrawing = (x: number, y: number) => {
    drawWorkflow.addPoint(x, y)
  }
  const finishFreeDrawing = () => {
    canvasState.value = 'idle'
  }
  const cancelFreeDrawing = () => {
    drawWorkflow.cancelFree()
    canvasState.value = 'idle'
  }

  return {
    currentTool: computed(() => currentTool.value),
    canvasState: computed(() => canvasState.value),

    // Expose workflow state for templates/previews
    imageWorkflow: imageWorkflow.workflow,
    drawingWorkflow: drawWorkflow.lineWorkflow,
    freeDrawingWorkflow: drawWorkflow.freeWorkflow,

    setTool,

    startTextInput,
    completeTextInput,

    startImageWorkflow,
    selectImageSize,
    updateImagePosition,
    cancelImageWorkflow,
    finishImageWorkflow,

    startElementDrawing,
    updateDrawingEndPosition,
    finishElementDrawing,
    cancelElementDrawing,

    startFreeDrawing,
    addPointToDrawing,
    finishFreeDrawing,
    cancelFreeDrawing,

    isImageWorkflowActive: imageWorkflow.isActive,
    isInSizeSelection: imageWorkflow.isInSizeSelection,
    isInPositioning: imageWorkflow.isInPositioning,
    isDrawingActive: drawWorkflow.isLineActive,
    isFreeDrawingActive: drawWorkflow.isFreeActive,
  }
}
