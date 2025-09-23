<template>
  <div v-if="isVisible" class="modal modal-open">
    <div class="modal-box">
      <h3 class="font-bold text-lg mb-4">Create New Canvas</h3>

      <div class="form-control w-full">
        <label class="label">
          <span class="label-text">Canvas Slug</span>
          <span class="label-text-alt text-xs">Alphanumeric and dashes only</span>
        </label>
        <input
          v-model="slug"
          type="text"
          placeholder="my-canvas"
          class="input input-bordered w-full"
          :class="{ 'input-error': slug && !isValidSlug }"
        />
        <label v-if="slug && !isValidSlug" class="label">
          <span class="label-text-alt text-error">Invalid slug format</span>
        </label>
      </div>

      <div class="modal-action">
        <button class="btn btn-ghost" @click="$emit('close')">
          Cancel
        </button>
        <button
          class="btn btn-primary"
          :disabled="!isValidSlug"
          @click="handleCreate"
        >
          Create Canvas
        </button>
      </div>
    </div>
    <div class="modal-backdrop" @click="$emit('close')"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

interface NewCanvasModalProps {
  isVisible: boolean
}

interface NewCanvasModalEmits {
  close: []
  create: [slug: string]
}

const props = defineProps<NewCanvasModalProps>()
const emit = defineEmits<NewCanvasModalEmits>()

const slug = ref('')

const isValidSlug = computed(() => {
  return /^[a-zA-Z0-9-]+$/.test(slug.value) && slug.value.length > 0
})

const handleCreate = () => {
  if (isValidSlug.value) {
    emit('create', slug.value)
    slug.value = ''
  }
}

watch(() => props.isVisible, (visible) => {
  if (!visible) {
    slug.value = ''
  }
})
</script>