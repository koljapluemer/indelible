<template>
  <div
    v-if="preview?.isActive && preview.state === 'positioning'"
    class="fixed pointer-events-none z-[9999]"
    :style="{
      left: preview.x + 'px',
      top: preview.y + 'px',
      transform: 'translate(0, 0)'
    }"
  >
    <div class="relative">
      <img
        :src="preview.data"
        :width="preview.displayWidth"
        :height="preview.displayHeight"
        :style="{
          opacity: 0.7
        }"
        class="block"
      />
      <div class="absolute top-2 left-2 bg-black/75 text-white px-2 py-1 rounded text-xs">
        <div>
          {{ preview.selectedSize ? (preview.selectedSize.charAt(0).toUpperCase() + preview.selectedSize.slice(1)) : 'Unknown' }} size - Click to place
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface ImagePreviewProps {
  preview: {
    isActive: boolean
    state: 'size-selection' | 'positioning'
    data: string
    originalWidth: number
    originalHeight: number
    selectedSize: 'small' | 'medium' | 'large' | null
    displayWidth: number
    displayHeight: number
    x: number
    y: number
  }
}

defineProps<ImagePreviewProps>()
</script>