<template>
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div class="bg-base-100 rounded-lg p-6 shadow-xl">
      <h3 class="text-lg font-semibold mb-4">Which size?</h3>

      <div class="space-y-3">
        <button @click="$emit('selectSize', 'small')" class="btn btn-primary w-full">
          Stamp
        </button>

        <button @click="$emit('selectSize', 'medium')" class="btn btn-primary w-full">
          Letter
        </button>

        <button @click="$emit('selectSize', 'large')" class="btn btn-primary w-full">
          Wallpaper
        </button>
      </div>

      <div class="mt-4">
        <button @click="$emit('cancel')" class="btn btn-ghost w-full">
          Cancel
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface ImageSizeModalEmits {
  selectSize: [size: 'small' | 'medium' | 'large']
  cancel: []
}

defineEmits<ImageSizeModalEmits>()
</script>