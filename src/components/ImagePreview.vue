<template>
  <div
    v-if="workflow.isActive && workflow.state === 'positioning'"
    class="absolute pointer-events-none z-[9999]"
    :style="{
      left: screenPos.x + 'px',
      top: screenPos.y + 'px',
    }"
  >
    <div class="relative">
      <img
        :src="workflow.data"
        :width="workflow.displayWidth"
        :height="workflow.displayHeight"
        class="block opacity-70"
      />
      <div class="absolute top-2 left-2 bg-black/75 text-white px-2 py-1 rounded text-xs">
        {{ workflow.selectedSize ? (workflow.selectedSize.charAt(0).toUpperCase() + workflow.selectedSize.slice(1)) : '' }} — Click to place
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useCanvasState } from '@/composables/useCanvasState'
import { useViewport } from '@/composables/useViewport'

const { imageWorkflow: workflow } = useCanvasState()
const { canvasToScreen } = useViewport()

const screenPos = computed(() => canvasToScreen(workflow.value.x, workflow.value.y))
</script>
