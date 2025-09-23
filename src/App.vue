<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Plus, List } from 'lucide-vue-next'
import InfinitePannableCanvas from './components/InfinitePannableCanvas.vue'
import Toolbar from './components/Toolbar.vue'
import TextInput from './components/TextInput.vue'
import NewCanvasModal from './components/NewCanvasModal.vue'
import CanvasListModal from './components/CanvasListModal.vue'
import ImagePreview from './components/ImagePreview.vue'
import ImageSizeModal from './components/ImageSizeModal.vue'
import DrawingPreview from './components/DrawingPreview.vue'
import { useCanvasManager } from './composables/useCanvasManager'
import { useCanvasState } from './composables/useCanvasState'
import { processImageFile, extractImageFromClipboard } from './utils/imageProcessor'
import { openFileDialog } from './utils/fileUpload'

const showTextInput = ref(false)
const textInputPosition = ref({ x: 0, y: 0 })
const pendingTextPosition = ref({ x: 0, y: 0 })
const showNewCanvasModal = ref(false)
const showCanvasListModal = ref(false)
const isStartingTextInput = ref(false)

const canvasManager = useCanvasManager()
const canvasState = useCanvasState()
const canvasTransform = ref({ x: 0, y: 0, scale: 1 })

const handleToolChange = async (tool: 'pan' | 'text' | 'image' | 'line' | 'tape' | 'draw') => {
  canvasState.setTool(tool)
  showTextInput.value = false

  // If image tool is selected, open file dialog
  if (tool === 'image') {
    try {
      const file = await openFileDialog()
      if (file) {
        const processedImage = await processImageFile(file)
        canvasState.startImageWorkflow(
          processedImage.data,
          processedImage.width,
          processedImage.height
        )
      } else {
        // User cancelled file dialog, reset to pan tool
        canvasState.setTool('pan')
      }
    } catch (error) {
      console.error('Failed to process image:', error)
      canvasState.setTool('pan')
    }
  }
}

const handleAddText = (canvasX: number, canvasY: number, screenX: number, screenY: number) => {
  if (canvasState.currentTool.value === 'text' && canvasState.canvasState.value === 'idle') {
    isStartingTextInput.value = true
    pendingTextPosition.value = { x: canvasX, y: canvasY }
    textInputPosition.value = { x: screenX, y: screenY }
    showTextInput.value = true
    canvasState.startTextInput()
  }
}

const handleTextConfirm = async (html: string) => {
  const success = await canvasManager.addTextElement(
    pendingTextPosition.value.x,
    pendingTextPosition.value.y,
    html
  )

  if (!success) {
    console.error('Failed to add text element')
  }

  showTextInput.value = false
  canvasState.completeTextInput()
}

const handleTextCancel = () => {
  showTextInput.value = false
  canvasState.completeTextInput()
}

const handleCreateCanvas = async (slug: string) => {
  const success = await canvasManager.createCanvas(slug)
  if (!success) {
    alert('Failed to create canvas. Slug might already exist or be invalid.')
  }
  showNewCanvasModal.value = false
}

const handleSwitchCanvas = async (slug: string) => {
  const success = await canvasManager.switchCanvas(slug)
  if (!success) {
    alert('Failed to switch to canvas')
  }
  showCanvasListModal.value = false
}

const handleDeleteCanvas = async (canvasId: number) => {
  if (confirm('Are you sure you want to delete this canvas? This action cannot be undone.')) {
    const success = await canvasManager.deleteCanvas(canvasId)
    if (!success) {
      alert('Failed to delete canvas')
    }
  }
}

const handleCanvasTransformChange = (transform: { x: number, y: number, scale: number }) => {
  canvasTransform.value = transform
}

const handlePaste = async (event: ClipboardEvent) => {
  const isTyping = event.target instanceof HTMLInputElement ||
                   event.target instanceof HTMLTextAreaElement ||
                   (event.target as HTMLElement)?.isContentEditable

  if (isTyping) return

  const imageFile = extractImageFromClipboard(event)
  if (imageFile) {
    event.preventDefault()
    try {
      const processedImage = await processImageFile(imageFile)
      canvasState.startImageWorkflow(
        processedImage.data,
        processedImage.width,
        processedImage.height
      )
    } catch (error) {
      console.error('Failed to process image:', error)
    }
  }
}

const handleMouseMove = (event: MouseEvent) => {
  if (canvasState.isInPositioning.value) {
    // Update image preview position to follow cursor
    canvasState.updateImagePosition(event.clientX, event.clientY)
  } else if (canvasState.isDrawingActive.value) {
    // Update drawing preview end position
    const rect = document.querySelector('[data-canvas="true"]')?.getBoundingClientRect()
    if (rect) {
      const screenX = event.clientX - rect.left
      const screenY = event.clientY - rect.top
      const canvasX = (screenX - canvasTransform.value.x) / canvasTransform.value.scale
      const canvasY = (screenY - canvasTransform.value.y) / canvasTransform.value.scale
      canvasState.updateDrawingEndPosition(canvasX, canvasY)
    }
  }
}


const handleImageClick = async (canvasX: number, canvasY: number) => {
  if (!canvasState.isInPositioning.value) return

  // Place image at canvas coordinates
  const workflow = canvasState.imageWorkflow.value

  const success = await canvasManager.addImageElement(
    canvasX,
    canvasY,
    workflow.data,
    workflow.displayWidth,
    workflow.displayHeight,
    1 // Always scale 1 since displayWidth/Height already account for sizing
  )

  if (!success) {
    console.error('Failed to add image element')
  } else {
    canvasState.finishImageWorkflow()
  }
}

const handleImageSizeSelect = (size: 'small' | 'medium' | 'large') => {
  canvasState.selectImageSize(size)
}

const handleImageSizeCancel = () => {
  canvasState.cancelImageWorkflow()
}

const handleStartDrawing = (canvasX: number, canvasY: number) => {
  const tool = canvasState.currentTool.value
  if ((tool === 'line' || tool === 'tape') && canvasState.canvasState.value === 'idle') {
    canvasState.startElementDrawing(tool, canvasX, canvasY)
  }
}

const handleFinishDrawing = async (canvasX: number, canvasY: number) => {
  if (canvasState.isDrawingActive.value) {
    const drawing = canvasState.drawingWorkflow.value
    const success = await canvasManager.addDrawingElement(
      drawing.element,
      drawing.startX,
      drawing.startY,
      canvasX,
      canvasY
    )

    if (!success) {
      console.error(`Failed to add ${drawing.element} element`)
    }

    canvasState.finishElementDrawing()
  }
}

const handleStartFreeDrawing = (canvasX: number, canvasY: number) => {
  if (canvasState.currentTool.value === 'draw' && canvasState.canvasState.value === 'idle') {
    canvasState.startFreeDrawing(canvasX, canvasY)
  }
}

const handleAddDrawPoint = (canvasX: number, canvasY: number) => {
  if (canvasState.isFreeDrawingActive.value) {
    canvasState.addPointToDrawing(canvasX, canvasY)
  }
}

const handleFinishFreeDrawing = async () => {
  if (canvasState.isFreeDrawingActive.value) {
    const path = canvasState.freeDrawingWorkflow.value.currentPath
    if (path.length > 1) { // Only save if there are multiple points
      const success = await canvasManager.addFreeDrawingElement(path)
      if (!success) {
        console.error('Failed to add drawing element')
      }
    }
    canvasState.finishFreeDrawing()
  }
}

const handleKeydown = (event: KeyboardEvent) => {
  // Don't handle shortcuts if user is typing in an input
  const isTyping = event.target instanceof HTMLInputElement ||
                   event.target instanceof HTMLTextAreaElement ||
                   (event.target as HTMLElement)?.isContentEditable

  if (event.key === 'Escape' && canvasState.isImageWorkflowActive.value) {
    event.preventDefault()
    canvasState.cancelImageWorkflow()
    return
  }

  if (event.key === 'Escape' && canvasState.isDrawingActive.value) {
    event.preventDefault()
    canvasState.cancelElementDrawing()
    return
  }

  if (event.key === 'Escape' && canvasState.isFreeDrawingActive.value) {
    event.preventDefault()
    canvasState.cancelFreeDrawing()
    return
  }

  if (isTyping || showTextInput.value) return

  if (event.code === 'Space') {
    event.preventDefault()
    canvasState.setTool('pan')
  } else if (event.key === 't') {
    event.preventDefault()
    canvasState.setTool('text')
  } else if (event.key === 'i') {
    event.preventDefault()
    handleToolChange('image')
  } else if (event.key === 'l') {
    event.preventDefault()
    handleToolChange('line')
  } else if (event.key === 'a') {
    event.preventDefault()
    handleToolChange('tape')
  } else if (event.key === 'd') {
    event.preventDefault()
    handleToolChange('draw')
  }
}

const handleDocumentClick = (event: MouseEvent) => {
  // Ignore clicks that are starting text input
  if (isStartingTextInput.value) {
    isStartingTextInput.value = false
    return
  }

  // If text input is visible and user clicks outside of it, save the text
  if (showTextInput.value) {
    const textInput = document.querySelector('[contenteditable="true"]')
    if (textInput && !textInput.contains(event.target as Node)) {
      handleTextConfirm(textInput.innerHTML)
    }
  }
}

onMounted(async () => {
  document.addEventListener('keydown', handleKeydown)
  document.addEventListener('paste', handlePaste)
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('click', handleDocumentClick)

  const hasCanvas = await canvasManager.initializeFromUrl()
  if (!hasCanvas) {
    // No canvases exist, show the new canvas modal
    showNewCanvasModal.value = true
  }
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  document.removeEventListener('paste', handlePaste)
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('click', handleDocumentClick)
})
</script>

<template>
  <div
    class="h-screen w-screen overflow-hidden bg-base-200"
    data-theme="light"
    :data-image-preview-active="canvasState.isImageWorkflowActive.value"
    :data-line-drawing-active="canvasState.isDrawingActive.value"
    :data-text-tool-active="canvasState.currentTool.value === 'text' && canvasState.canvasState.value === 'idle'"
    :data-line-tool-active="canvasState.currentTool.value === 'line' && canvasState.canvasState.value === 'idle'"
    :data-tape-tool-active="canvasState.currentTool.value === 'tape' && canvasState.canvasState.value === 'idle'"
    :data-draw-tool-active="canvasState.currentTool.value === 'draw' && canvasState.canvasState.value === 'idle'"
    :data-free-drawing-active="canvasState.isFreeDrawingActive.value"
  >
    <!-- Canvas Management Header -->
    <div class="fixed top-4 left-4 z-50">
      <div class="flex items-center gap-3 bg-base-100 p-2 rounded-lg shadow-lg">
        <button
          class="btn btn-sm btn-primary"
          @click="showNewCanvasModal = true"
          title="New Canvas"
        >
          <Plus class="w-4 h-4" />
        </button>
        <button
          class="btn btn-sm btn-ghost"
          @click="showCanvasListModal = true"
          title="Canvas List"
        >
          <List class="w-4 h-4" />
        </button>
        <div v-if="canvasManager.currentCanvas.value" class="divider divider-horizontal mx-0"></div>
        <span v-if="canvasManager.currentCanvas.value" class="text-sm font-mono">
          {{ canvasManager.currentCanvas.value.slug }}
        </span>
      </div>
    </div>

    <InfinitePannableCanvas
      :is-pan-mode="canvasState.currentTool.value === 'pan'"
      :elements="canvasManager.elements.value"
      @add-text="handleAddText"
      @add-image="handleImageClick"
      @start-line="handleStartDrawing"
      @finish-line="handleFinishDrawing"
      @start-draw="handleStartFreeDrawing"
      @add-draw-point="handleAddDrawPoint"
      @finish-draw="handleFinishFreeDrawing"
      @transform-change="handleCanvasTransformChange"
    />

    <Toolbar
      :current-tool="canvasState.currentTool.value"
      :canvas-state="canvasState.canvasState.value"
      @tool-changed="handleToolChange"
    />

    <TextInput
      :is-visible="showTextInput"
      :position="textInputPosition"
      @confirm="handleTextConfirm"
      @cancel="handleTextCancel"
    />

    <!-- Modals -->
    <NewCanvasModal
      :is-visible="showNewCanvasModal"
      @close="showNewCanvasModal = false"
      @create="handleCreateCanvas"
    />

    <CanvasListModal
      :is-visible="showCanvasListModal"
      :canvases="canvasManager.canvases.value"
      :current-canvas="canvasManager.currentCanvas.value"
      @close="showCanvasListModal = false"
      @switch="handleSwitchCanvas"
      @delete="handleDeleteCanvas"
    />

    <ImagePreview :preview="canvasState.imageWorkflow.value" />

    <DrawingPreview
      :is-active="canvasState.isDrawingActive.value"
      :element-type="canvasState.drawingWorkflow.value.element"
      :start-x="canvasState.drawingWorkflow.value.startX * canvasTransform.scale + canvasTransform.x"
      :start-y="canvasState.drawingWorkflow.value.startY * canvasTransform.scale + canvasTransform.y"
      :end-x="canvasState.drawingWorkflow.value.endX * canvasTransform.scale + canvasTransform.x"
      :end-y="canvasState.drawingWorkflow.value.endY * canvasTransform.scale + canvasTransform.y"
    />

    <DrawingPreview
      :is-active="canvasState.isFreeDrawingActive.value"
      element-type="drawing"
      :start-x="0"
      :start-y="0"
      :end-x="0"
      :end-y="0"
      :drawing-path="canvasState.freeDrawingWorkflow.value.currentPath.map(p => ({
        x: p.x * canvasTransform.scale + canvasTransform.x,
        y: p.y * canvasTransform.scale + canvasTransform.y
      }))"
    />

    <ImageSizeModal
      v-if="canvasState.isInSizeSelection.value"
      @select-size="handleImageSizeSelect"
      @cancel="handleImageSizeCancel"
    />
  </div>
</template>
