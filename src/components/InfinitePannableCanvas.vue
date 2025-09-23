<template>
  <div
    ref="canvasContainer"
    class="relative w-full h-full overflow-hidden bg-base-200"
    :class="[
      isPanMode ? 'cursor-grab active:cursor-grabbing' : 'cursor-crosshair'
    ]"
    @mousedown="startPanning"
    @mousemove="handlePanning"
    @mouseup="stopPanning"
    @mouseleave="stopPanning"
    @wheel="handleWheel"
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
      :style="canvasStyle"
      style="width: 10000px; height: 10000px;"
    >
      <!-- Text elements -->
      <div
        v-for="textElement in textElements"
        :key="textElement.id"
        class="absolute pointer-events-none select-none"
        :style="{
          left: textElement.x + 'px',
          top: textElement.y + 'px',
        }"
      >
        <MarkdownText :content="textElement.content" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import MarkdownText from './MarkdownText.vue'

export interface TextElement {
  id: string
  x: number
  y: number
  content: string
  timestamp: number
}

interface CanvasProps {
  isPanMode: boolean
  textElements: TextElement[]
}

interface CanvasEmits {
  addText: [x: number, y: number]
}

const props = defineProps<CanvasProps>()
const emit = defineEmits<CanvasEmits>()

const canvasContainer = ref<HTMLElement>()
const canvas = ref<HTMLElement>()

const transform = ref({ x: 0, y: 0, scale: 1 })
const isPanning = ref(false)
const lastPanPoint = ref({ x: 0, y: 0 })

const canvasStyle = computed(() => ({
  transform: `translate(${transform.value.x}px, ${transform.value.y}px) scale(${transform.value.scale})`,
  transformOrigin: '0 0'
}))

const startPanning = (event: MouseEvent) => {
  if (!props.isPanMode) return

  isPanning.value = true
  lastPanPoint.value = { x: event.clientX, y: event.clientY }
  event.preventDefault()
}

const handlePanning = (event: MouseEvent) => {
  if (!isPanning.value || !props.isPanMode) return

  const deltaX = event.clientX - lastPanPoint.value.x
  const deltaY = event.clientY - lastPanPoint.value.y

  transform.value.x += deltaX
  transform.value.y += deltaY

  lastPanPoint.value = { x: event.clientX, y: event.clientY }
  event.preventDefault()
}

const stopPanning = () => {
  isPanning.value = false
}

const handleWheel = (event: WheelEvent) => {
  event.preventDefault()

  const scaleFactor = event.deltaY > 0 ? 0.9 : 1.1
  const newScale = Math.max(0.1, Math.min(3, transform.value.scale * scaleFactor))

  if (newScale !== transform.value.scale) {
    const rect = canvasContainer.value?.getBoundingClientRect()
    if (rect) {
      const mouseX = event.clientX - rect.left
      const mouseY = event.clientY - rect.top

      // Calculate the point to zoom into
      const beforeZoomX = (mouseX - transform.value.x) / transform.value.scale
      const beforeZoomY = (mouseY - transform.value.y) / transform.value.scale

      transform.value.scale = newScale

      // Adjust position to zoom into the mouse position
      transform.value.x = mouseX - beforeZoomX * newScale
      transform.value.y = mouseY - beforeZoomY * newScale
    }
  }
}

const handleCanvasClick = (event: MouseEvent) => {
  if (props.isPanMode || isPanning.value) return

  const rect = canvasContainer.value?.getBoundingClientRect()
  if (!rect) return

  const clickX = event.clientX - rect.left
  const clickY = event.clientY - rect.top

  // Convert screen coordinates to canvas coordinates
  const canvasX = (clickX - transform.value.x) / transform.value.scale
  const canvasY = (clickY - transform.value.y) / transform.value.scale

  emit('addText', canvasX, canvasY)
}
</script>