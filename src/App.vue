<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import InfinitePannableCanvas from './components/InfinitePannableCanvas.vue'
import Toolbar from './components/Toolbar.vue'
import TextInput from './components/TextInput.vue'
import Sidebar from './components/Sidebar.vue'
import ImagePreview from './components/ImagePreview.vue'
import ImageSizeModal from './components/ImageSizeModal.vue'
import DrawingPreview from './components/DrawingPreview.vue'
import HtmlText from './components/HtmlText.vue'
import CanvasLine from './components/elements/CanvasLine.vue'
import CanvasTape from './components/elements/CanvasTape.vue'
import CanvasDrawing from './components/elements/CanvasDrawing.vue'
import { useCanvasManager } from './composables/useCanvasManager'
import { useCanvasState } from './composables/useCanvasState'
import { useTextWorkflow } from './composables/useTextWorkflow'
import { useImageWorkflow } from './composables/useImageWorkflow'
import { useDrawWorkflow } from './composables/useDrawWorkflow'
import { useViewport } from './composables/useViewport'
import { processImageFile, extractImageFromClipboard } from './utils/imageProcessor'

const sidebarRef = ref<InstanceType<typeof Sidebar>>()
const textInputRef = ref<InstanceType<typeof TextInput>>()
const canvasAreaRef = ref<HTMLElement>()
const isStartingTextInput = ref(false)

const canvasManager = useCanvasManager()
const canvasState = useCanvasState()
const textWorkflow = useTextWorkflow()
const imageWorkflow = useImageWorkflow()
const drawWorkflow = useDrawWorkflow()
const { screenToCanvas } = useViewport()

// ── Tool selection ──────────────────────────────────────────────────────────

const handleToolChange = async (tool: 'pan' | 'text' | 'image' | 'line' | 'tape' | 'draw') => {
  if (tool === 'image') {
    const ok = await imageWorkflow.activate()
    if (!ok) return  // user cancelled file dialog
    canvasState.setTool('image')
    canvasState.startImageWorkflow(
      imageWorkflow.workflow.value.data,
      imageWorkflow.workflow.value.originalWidth,
      imageWorkflow.workflow.value.originalHeight,
    )
  } else {
    canvasState.setTool(tool)
  }
}

// ── Text ────────────────────────────────────────────────────────────────────

const handleAddText = (canvasX: number, canvasY: number, clientX: number, clientY: number) => {
  if (canvasState.currentTool.value === 'text' && canvasState.canvasState.value === 'idle') {
    isStartingTextInput.value = true
    textWorkflow.start(canvasX, canvasY, clientX, clientY)
    canvasState.startTextInput()
  }
}

const handleTextConfirm = async (html: string) => {
  await textWorkflow.confirm(html)
  canvasState.completeTextInput()
}

const handleTextCancel = () => {
  textWorkflow.cancel()
  canvasState.completeTextInput()
}

// ── Image ───────────────────────────────────────────────────────────────────

const handleImageClick = async (canvasX: number, canvasY: number) => {
  if (!canvasState.isInPositioning.value) return
  await imageWorkflow.place(canvasX, canvasY)
  canvasState.finishImageWorkflow()
}

// ── Line / tape ─────────────────────────────────────────────────────────────

const handleStartDrawing = (canvasX: number, canvasY: number) => {
  const tool = canvasState.currentTool.value
  if ((tool === 'line' || tool === 'tape') && canvasState.canvasState.value === 'idle') {
    canvasState.startElementDrawing(tool, canvasX, canvasY)
  }
}

const handleFinishDrawing = async (canvasX: number, canvasY: number) => {
  if (!canvasState.isDrawingActive.value) return
  const w = drawWorkflow.lineWorkflow.value
  await canvasManager.addDrawingElement(w.element, w.startX, w.startY, canvasX, canvasY)
  canvasState.finishElementDrawing()
  drawWorkflow.cancelLine()
}

// ── Free drawing ─────────────────────────────────────────────────────────────

const handleStartFreeDrawing = (canvasX: number, canvasY: number) => {
  if (canvasState.currentTool.value === 'draw' && canvasState.canvasState.value === 'idle') {
    canvasState.startFreeDrawing(canvasX, canvasY)
  }
}

const handleAddDrawPoint = (canvasX: number, canvasY: number) => {
  if (canvasState.isFreeDrawingActive.value) drawWorkflow.addPoint(canvasX, canvasY)
}

const handleFinishFreeDrawing = async () => {
  if (!canvasState.isFreeDrawingActive.value) return
  await drawWorkflow.finishFree()
  canvasState.finishFreeDrawing()
}

// ── Mouse move (image positioning + line preview) ────────────────────────────

const handleMouseMove = (event: MouseEvent) => {
  const rect = canvasAreaRef.value?.getBoundingClientRect()
  if (!rect) return
  const { x, y } = screenToCanvas(event.clientX - rect.left, event.clientY - rect.top)

  if (canvasState.isInPositioning.value) {
    imageWorkflow.updatePosition(x, y)
  } else if (canvasState.isDrawingActive.value) {
    drawWorkflow.updateLineEnd(x, y)
  }
}

// ── Paste ────────────────────────────────────────────────────────────────────

const handlePaste = async (event: ClipboardEvent) => {
  const isTyping = event.target instanceof HTMLInputElement ||
                   event.target instanceof HTMLTextAreaElement ||
                   (event.target as HTMLElement)?.isContentEditable
  if (isTyping) return

  const imageFile = extractImageFromClipboard(event)
  if (!imageFile) return

  event.preventDefault()
  try {
    const processed = await processImageFile(imageFile)
    imageWorkflow.activateWithData(processed.data, processed.width, processed.height)
    canvasState.setTool('image')
    canvasState.startImageWorkflow(processed.data, processed.width, processed.height)
  } catch (error) {
    console.error('Failed to process image:', error)
  }
}

// ── Keyboard ─────────────────────────────────────────────────────────────────

const handleKeydown = (event: KeyboardEvent) => {
  const isTyping = event.target instanceof HTMLInputElement ||
                   event.target instanceof HTMLTextAreaElement ||
                   (event.target as HTMLElement)?.isContentEditable

  if (event.key === 'Escape') {
    if (canvasState.isImageWorkflowActive.value) { event.preventDefault(); canvasState.cancelImageWorkflow(); return }
    if (canvasState.isDrawingActive.value) { event.preventDefault(); canvasState.cancelElementDrawing(); return }
    if (canvasState.isFreeDrawingActive.value) { event.preventDefault(); canvasState.cancelFreeDrawing(); return }
  }

  if (isTyping || textWorkflow.isActive.value) return

  if (event.code === 'Space') { event.preventDefault(); canvasState.setTool('pan') }
  else if (event.key === 't') { event.preventDefault(); canvasState.setTool('text') }
  else if (event.key === 'i') { event.preventDefault(); handleToolChange('image') }
  else if (event.key === 'l') { event.preventDefault(); handleToolChange('line') }
  else if (event.key === 'a') { event.preventDefault(); handleToolChange('tape') }
  else if (event.key === 'd') { event.preventDefault(); handleToolChange('draw') }
}

// ── Outside-click closes text input ──────────────────────────────────────────

const handleDocumentClick = (event: MouseEvent) => {
  if (isStartingTextInput.value) { isStartingTextInput.value = false; return }
  if (textWorkflow.isActive.value) {
    const proseMirror = document.querySelector('.ProseMirror')
    if (proseMirror && !proseMirror.contains(event.target as Node)) {
      textInputRef.value?.confirmText()
    }
  }
}

onMounted(async () => {
  document.addEventListener('keydown', handleKeydown)
  document.addEventListener('paste', handlePaste)
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('click', handleDocumentClick)

  const hasCanvas = await canvasManager.initializeFromUrl()
  if (!hasCanvas) sidebarRef.value?.focusNewSlug()
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  document.removeEventListener('paste', handlePaste)
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('click', handleDocumentClick)
})
</script>

<template>
  <div class="flex h-screen w-screen overflow-hidden" data-theme="light">
    <Sidebar ref="sidebarRef" />

    <!-- Canvas area — all overlays are position:absolute relative to this div -->
    <div ref="canvasAreaRef" class="flex-1 relative overflow-hidden">
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
      >
        <template #default="{ element }">
          <HtmlText v-if="element.type === 'text'" :content="element.data" />
          <img
            v-else-if="element.type === 'image'"
            :src="element.data"
            :width="element.width"
            :height="element.height"
            class="block"
          />
          <CanvasLine    v-else-if="element.type === 'line'"    :element="element" />
          <CanvasTape    v-else-if="element.type === 'tape'"    :element="element" />
          <CanvasDrawing v-else-if="element.type === 'drawing'" :element="element" />
        </template>
      </InfinitePannableCanvas>

      <!-- position:absolute overlays, correctly scoped to canvas area -->
      <ImagePreview />

      <DrawingPreview
        :is-active="canvasState.isDrawingActive.value"
        :element-type="canvasState.drawingWorkflow.value.element"
        :start-x="canvasState.drawingWorkflow.value.startX"
        :start-y="canvasState.drawingWorkflow.value.startY"
        :end-x="canvasState.drawingWorkflow.value.endX"
        :end-y="canvasState.drawingWorkflow.value.endY"
      />

      <DrawingPreview
        :is-active="canvasState.isFreeDrawingActive.value"
        element-type="drawing"
        :start-x="0" :start-y="0" :end-x="0" :end-y="0"
        :drawing-path="canvasState.freeDrawingWorkflow.value.currentPath"
      />

      <ImageSizeModal
        v-if="canvasState.isInSizeSelection.value"
        @select-size="imageWorkflow.selectSize"
        @cancel="canvasState.cancelImageWorkflow"
      />
    </div>

    <Toolbar
      :current-tool="canvasState.currentTool.value"
      :canvas-state="canvasState.canvasState.value"
      @tool-changed="handleToolChange"
    />

    <TextInput
      ref="textInputRef"
      :is-visible="textWorkflow.isActive.value"
      :position="textWorkflow.screenPosition.value"
      @confirm="handleTextConfirm"
      @cancel="handleTextCancel"
    />
  </div>
</template>
