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
    <line
      :x1="x1" :y1="y1"
      :x2="x2" :y2="y2"
      stroke="currentColor"
      stroke-width="2"
      class="text-base-content"
    />
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CanvasElement } from '@/stores/database'

const props = defineProps<{ element: CanvasElement }>()

const PAD = 2

const ex = computed(() => props.element.endX ?? props.element.x)
const ey = computed(() => props.element.endY ?? props.element.y)

const minX = computed(() => Math.min(props.element.x, ex.value))
const minY = computed(() => Math.min(props.element.y, ey.value))
const maxX = computed(() => Math.max(props.element.x, ex.value))
const maxY = computed(() => Math.max(props.element.y, ey.value))

const w = computed(() => Math.round(maxX.value - minX.value) + PAD * 2)
const h = computed(() => Math.round(maxY.value - minY.value) + PAD * 2)

// SVG is positioned so its top-left = (minX - PAD, minY - PAD) in canvas space
// relative to element.x/y (which is the wrapper's top-left):
const offsetX = computed(() => Math.round(minX.value - props.element.x) - PAD)
const offsetY = computed(() => Math.round(minY.value - props.element.y) - PAD)

// Line coords within the SVG
const x1 = computed(() => Math.round(props.element.x - minX.value) + PAD)
const y1 = computed(() => Math.round(props.element.y - minY.value) + PAD)
const x2 = computed(() => Math.round(ex.value - minX.value) + PAD)
const y2 = computed(() => Math.round(ey.value - minY.value) + PAD)
</script>
