<template>
  <div
    v-if="isActive"
    class="fixed inset-0 pointer-events-none z-40"
  >
    <svg class="w-full h-full">
      <line
        v-if="elementType === 'line'"
        :x1="startX"
        :y1="startY"
        :x2="endX"
        :y2="endY"
        stroke="currentColor"
        stroke-width="2"
        class="text-primary"
      />
      <g v-else-if="elementType === 'tape'">
        <!-- Tape as thick line with beige color and dotted pattern -->
        <defs>
          <pattern id="tape-stroke-dots" patternUnits="userSpaceOnUse" width="8" height="8">
            <rect width="8" height="8" fill="#f5f5dc" />
            <circle cx="4" cy="4" r="1" fill="#e6d7a3" />
          </pattern>
        </defs>
        <line
          :x1="startX"
          :y1="startY"
          :x2="endX"
          :y2="endY"
          stroke="url(#tape-stroke-dots)"
          stroke-width="80"
          stroke-linecap="round"
        />
      </g>
      <polyline
        v-else-if="elementType === 'drawing' && drawingPath && drawingPath.length > 1"
        :points="drawingPath.map(p => `${p.x},${p.y}`).join(' ')"
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
import type { DrawingElement } from '../utils/drawingUtils'

interface DrawingPreviewProps {
  isActive: boolean
  elementType: DrawingElement
  startX: number
  startY: number
  endX: number
  endY: number
  drawingPath?: { x: number; y: number }[]
}

defineProps<DrawingPreviewProps>()
</script>