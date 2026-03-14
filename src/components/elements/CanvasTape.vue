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
    <defs>
      <pattern :id="`tape-dots-${element.id}`" patternUnits="userSpaceOnUse" width="8" height="8">
        <rect width="8" height="8" fill="#f5f5dc" />
        <circle cx="4" cy="4" r="1" fill="#e6d7a3" />
      </pattern>
    </defs>
    <line
      :x1="x1" :y1="y1"
      :x2="x2" :y2="y2"
      :stroke="`url(#tape-dots-${element.id})`"
      stroke-width="80"
      stroke-linecap="round"
    />
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CanvasElement } from '@/stores/database'

const props = defineProps<{ element: CanvasElement }>()
const { element } = props

const PAD = 42  // half of stroke-width (80) rounded up

const ex = computed(() => element.endX ?? element.x)
const ey = computed(() => element.endY ?? element.y)

const minX = computed(() => Math.min(element.x, ex.value))
const minY = computed(() => Math.min(element.y, ey.value))
const maxX = computed(() => Math.max(element.x, ex.value))
const maxY = computed(() => Math.max(element.y, ey.value))

const w = computed(() => Math.round(maxX.value - minX.value) + PAD * 2)
const h = computed(() => Math.round(maxY.value - minY.value) + PAD * 2)

const offsetX = computed(() => Math.round(minX.value - element.x) - PAD)
const offsetY = computed(() => Math.round(minY.value - element.y) - PAD)

const x1 = computed(() => Math.round(element.x - minX.value) + PAD)
const y1 = computed(() => Math.round(element.y - minY.value) + PAD)
const x2 = computed(() => Math.round(ex.value - minX.value) + PAD)
const y2 = computed(() => Math.round(ey.value - minY.value) + PAD)
</script>
