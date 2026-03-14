<template>
  <svg
    class="absolute pointer-events-none overflow-visible"
    :style="{
      width: w + 'px',
      height: h + 'px',
      left: offsetX + 'px',
      top: offsetY + 'px',
    }"
  >
    <polyline
      :points="relativePoints"
      stroke="currentColor"
      stroke-width="2"
      fill="none"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="text-base-content"
    />
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CanvasElement } from '@/stores/database'

const props = defineProps<{ element: CanvasElement }>()

const PAD = 4

const path = computed((): { x: number; y: number }[] => {
  try { return JSON.parse(props.element.data) } catch { return [] }
})

const minX = computed(() => Math.min(...path.value.map(p => p.x)))
const minY = computed(() => Math.min(...path.value.map(p => p.y)))
const maxX = computed(() => Math.max(...path.value.map(p => p.x)))
const maxY = computed(() => Math.max(...path.value.map(p => p.y)))

const w = computed(() => Math.round(maxX.value - minX.value) + PAD * 2)
const h = computed(() => Math.round(maxY.value - minY.value) + PAD * 2)

// Offset from the element's anchor (element.x/y = first path point) to the bounding box top-left
const offsetX = computed(() => Math.round(minX.value - props.element.x) - PAD)
const offsetY = computed(() => Math.round(minY.value - props.element.y) - PAD)

const relativePoints = computed(() =>
  path.value.map(p =>
    `${Math.round(p.x - minX.value) + PAD},${Math.round(p.y - minY.value) + PAD}`
  ).join(' ')
)
</script>
