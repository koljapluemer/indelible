<template>
  <div
    ref="canvasContainer"
    data-canvas="true"
    class="relative w-full h-full overflow-hidden bg-base-200"
    :class="[
      isPanMode ? 'cursor-grab active:cursor-grabbing' : 'cursor-crosshair'
    ]"
    @mousedown="startPanning"
    @mousemove="handlePanning"
    @mouseup="stopPanning"
    @mouseleave="stopPanning"
    @wheel.prevent="handleWheel"
    @click="handleCanvasClick"
  >
    <!-- Grid pattern background -->
    <div class="absolute inset-0 opacity-30">
      <svg class="w-full h-full">
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" stroke-width="0.5"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
    </div>

    <!-- Canvas content -->
    <div
      ref="canvas"
      class="relative"
      :style="{ transform: cssTransform, transformOrigin: '0 0', width: '10000px', height: '10000px' }"
    >
      <div
        v-for="element in elements"
        :key="element.id"
        class="absolute pointer-events-none select-none"
        :style="{
          left: Math.round(element.x) + 'px',
          top: Math.round(element.y) + 'px',
          transform: `scale(${element.scale})`
        }"
      >
        <slot :element="element" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useViewport } from '../composables/useViewport'
import { useCanvasState } from '../composables/useCanvasState'
import type { CanvasElement } from '../stores/database'

interface CanvasProps {
  isPanMode: boolean
  elements: CanvasElement[]
}

interface CanvasEmits {
  addText: [canvasX: number, canvasY: number, clientX: number, clientY: number]
  addImage: [canvasX: number, canvasY: number]
  startLine: [canvasX: number, canvasY: number]
  finishLine: [canvasX: number, canvasY: number]
  startDraw: [canvasX: number, canvasY: number]
  addDrawPoint: [canvasX: number, canvasY: number]
  finishDraw: []
}

const props = defineProps<CanvasProps>()
const emit = defineEmits<CanvasEmits>()

const canvasContainer = ref<HTMLElement>()
const canvas = ref<HTMLElement>()

const { viewport, setViewport, screenToCanvas, cssTransform } = useViewport()
const canvasState = useCanvasState()

const isPanning = ref(false)
const lastPanPoint = ref({ x: 0, y: 0 })

const getContainerCoords = (event: MouseEvent) => {
  const rect = canvasContainer.value?.getBoundingClientRect()
  if (!rect) return null
  return { sx: event.clientX - rect.left, sy: event.clientY - rect.top }
}

const startPanning = (event: MouseEvent) => {
  if (canvasState.currentTool.value === 'draw' && canvasState.canvasState.value === 'idle') {
    const coords = getContainerCoords(event)
    if (coords) {
      const { x, y } = screenToCanvas(coords.sx, coords.sy)
      emit('startDraw', x, y)
    }
    event.preventDefault()
    return
  }

  if (!props.isPanMode) return
  isPanning.value = true
  lastPanPoint.value = { x: event.clientX, y: event.clientY }
  event.preventDefault()
}

const handlePanning = (event: MouseEvent) => {
  if (canvasState.isFreeDrawingActive.value) {
    const coords = getContainerCoords(event)
    if (coords) {
      const { x, y } = screenToCanvas(coords.sx, coords.sy)
      emit('addDrawPoint', x, y)
    }
    event.preventDefault()
    return
  }

  if (!isPanning.value || !props.isPanMode) return

  const deltaX = event.clientX - lastPanPoint.value.x
  const deltaY = event.clientY - lastPanPoint.value.y

  setViewport({
    x: viewport.value.x + deltaX,
    y: viewport.value.y + deltaY,
    scale: viewport.value.scale,
  })

  lastPanPoint.value = { x: event.clientX, y: event.clientY }
  event.preventDefault()
}

const stopPanning = () => {
  if (canvasState.isFreeDrawingActive.value) {
    emit('finishDraw')
    return
  }
  isPanning.value = false
}

const handleWheel = (event: WheelEvent) => {
  const scaleFactor = event.deltaY > 0 ? 0.9 : 1.1
  const newScale = Math.max(0.1, Math.min(3, viewport.value.scale * scaleFactor))

  if (newScale === viewport.value.scale) return

  const rect = canvasContainer.value?.getBoundingClientRect()
  if (!rect) return

  const mouseX = event.clientX - rect.left
  const mouseY = event.clientY - rect.top
  const beforeX = (mouseX - viewport.value.x) / viewport.value.scale
  const beforeY = (mouseY - viewport.value.y) / viewport.value.scale

  setViewport({
    scale: newScale,
    x: mouseX - beforeX * newScale,
    y: mouseY - beforeY * newScale,
  })
}

const handleCanvasClick = (event: MouseEvent) => {
  if (props.isPanMode || isPanning.value) return

  const coords = getContainerCoords(event)
  if (!coords) return

  const { x: canvasX, y: canvasY } = screenToCanvas(coords.sx, coords.sy)
  const tool = canvasState.currentTool.value
  const state = canvasState.canvasState.value

  if (canvasState.isImageWorkflowActive.value) {
    emit('addImage', canvasX, canvasY)
  } else if (canvasState.isDrawingActive.value) {
    emit('finishLine', canvasX, canvasY)
  } else if (state === 'idle') {
    if (tool === 'line' || tool === 'tape') {
      emit('startLine', canvasX, canvasY)
    } else if (tool === 'draw') {
      emit('startDraw', canvasX, canvasY)
    } else if (tool === 'text') {
      emit('addText', canvasX, canvasY, event.clientX, event.clientY)
    }
  }
}
</script>
