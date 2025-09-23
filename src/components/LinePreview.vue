<template>
  <div
    v-if="isActive"
    class="fixed inset-0 pointer-events-none z-40"
  >
    <svg class="w-full h-full">
      <line
        :x1="startX"
        :y1="startY"
        :x2="endX"
        :y2="endY"
        stroke="currentColor"
        stroke-width="2"
        class="text-primary"
      />
    </svg>
  </div>
</template>

<script setup lang="ts">
interface LinePreviewProps {
  isActive: boolean
  startX: number
  startY: number
  endX: number
  endY: number
}

defineProps<LinePreviewProps>()
</script>