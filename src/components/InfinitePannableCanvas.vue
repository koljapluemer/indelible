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
      <!-- Canvas elements -->
      <div
        v-for="element in elements"
        :key="element.id"
        class="absolute pointer-events-none select-none"
        :style="{
          left: element.x + 'px',
          top: element.y + 'px',
          transform: `scale(${element.scale})`
        }"
      >
        <HtmlText
          v-if="element.type === 'text'"
          :content="element.data"
        />
        <img
          v-else-if="element.type === 'image'"
          :src="element.data"
          :width="element.width"
          :height="element.height"
          class="block"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import HtmlText from './HtmlText.vue'
import type { CanvasElement } from '../stores/database'

interface CanvasProps {
  isPanMode: boolean
  elements: CanvasElement[]
}

interface CanvasEmits {
  addText: [canvasX: number, canvasY: number, screenX: number, screenY: number]
  addImage: [canvasX: number, canvasY: number]
  transformChange: [transform: { x: number, y: number, scale: number }]
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

  emit('transformChange', { ...transform.value })
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

      emit('transformChange', { ...transform.value })
    }
  }
}

const handleCanvasClick = (event: MouseEvent) => {
  if (props.isPanMode || isPanning.value) return

  const rect = canvasContainer.value?.getBoundingClientRect()
  if (!rect) return

  const screenX = event.clientX - rect.left
  const screenY = event.clientY - rect.top

  // Convert screen coordinates to canvas coordinates
  const canvasX = (screenX - transform.value.x) / transform.value.scale
  const canvasY = (screenY - transform.value.y) / transform.value.scale

  // Check if we're in image preview mode by checking parent component state
  const app = document.querySelector('[data-image-preview-active="true"]')
  if (app) {
    emit('addImage', canvasX, canvasY)
  } else {
    emit('addText', canvasX, canvasY, screenX, screenY)
  }
}
</script>