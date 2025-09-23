<template>
  <div
    v-if="isVisible"
    class="fixed z-50 card card-compact bg-base-100 shadow-xl border border-primary"
    :style="{
      left: position.x + 'px',
      top: position.y + 'px',
    }"
  >
    <div class="card-body">
      <input
        ref="textInput"
        v-model="text"
        type="text"
        placeholder="Enter text..."
        class="input input-sm input-bordered w-48"
        @keydown.enter="confirmText"
        @keydown.escape="cancelText"
        @blur="confirmText"
      />
      <div class="card-actions justify-end mt-2">
        <button class="btn btn-xs btn-ghost" @click="cancelText">Cancel</button>
        <button class="btn btn-xs btn-primary" @click="confirmText">Add</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, watch } from 'vue'

interface TextInputProps {
  isVisible: boolean
  position: { x: number; y: number }
}

interface TextInputEmits {
  confirm: [text: string]
  cancel: []
}

const props = defineProps<TextInputProps>()
const emit = defineEmits<TextInputEmits>()

const textInput = ref<HTMLInputElement>()
const text = ref('')

const confirmText = () => {
  if (text.value.trim()) {
    emit('confirm', text.value.trim())
    text.value = ''
  } else {
    emit('cancel')
  }
}

const cancelText = () => {
  text.value = ''
  emit('cancel')
}

watch(() => props.isVisible, async (visible) => {
  if (visible) {
    await nextTick()
    textInput.value?.focus()
  }
})
</script>