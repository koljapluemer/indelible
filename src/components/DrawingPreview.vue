<template>
  <div
    v-if="isActive"
    class="absolute inset-0 pointer-events-none z-40"
  >
    <svg class="w-full h-full">
      <line
        v-if="elementType === 'line'"
        :x1="s1.x" :y1="s1.y"
        :x2="s2.x" :y2="s2.y"
        stroke="currentColor"
        stroke-width="2"
        class="text-primary"
      />
      <g v-else-if="elementType === 'tape'">
        <defs>
          <pattern id="tape-stroke-dots" patternUnits="userSpaceOnUse" width="8" height="8">
            <rect width="8" height="8" fill="#f5f5dc" />
            <circle cx="4" cy="4" r="1" fill="#e6d7a3" />
          </pattern>
        </defs>
        <line
          :x1="s1.x" :y1="s1.y"
          :x2="s2.x" :y2="s2.y"
          stroke="url(#tape-stroke-dots)"
          stroke-width="80"
          stroke-linecap="round"
        />
      </g>
      <polyline
        v-else-if="elementType === 'drawing' && screenPath.length > 1"
        :points="screenPath.map(p => `${p.x},${p.y}`).join(' ')"
        stroke="currentColor"
        stroke-width="2"
        fill="none"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="text-base-content"
      />
    </svg>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useViewport } from '@/composables/useViewport'
import type { DrawingElement } from '@/utils/drawingUtils'

interface DrawingPreviewProps {
  isActive: boolean
  elementType: DrawingElement
  startX: number
  startY: number
  endX: number
  endY: number
  drawingPath?: { x: number; y: number }[]
}

const props = defineProps<DrawingPreviewProps>()

const { canvasToScreen } = useViewport()

const s1 = computed(() => canvasToScreen(props.startX, props.startY))
const s2 = computed(() => canvasToScreen(props.endX, props.endY))
const screenPath = computed(() => (props.drawingPath ?? []).map(p => canvasToScreen(p.x, p.y)))
</script>
