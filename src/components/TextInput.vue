<template>
  <!-- Invisible text editor positioned exactly where text will appear -->
  <div
    v-if="isVisible"
    ref="textEditor"
    contenteditable="true"
    class="fixed z-50 text-base-content focus:outline-none"
    :style="{
      left: position.x + 'px',
      top: position.y + 'px',
      background: 'transparent',
      border: 'none',
      minWidth: '20px',
      minHeight: '1.5rem',
      wordWrap: 'break-word',
      whiteSpace: 'pre-wrap'
    }"
    @keydown="handleKeydown"
    @input="updateContent"
  />
</template>

<script setup lang="ts">
import { ref, nextTick, watch } from 'vue'

interface TextInputProps {
  isVisible: boolean
  position: { x: number; y: number }
}

interface TextInputEmits {
  confirm: [html: string]
  cancel: []
}

const props = defineProps<TextInputProps>()
const emit = defineEmits<TextInputEmits>()

const textEditor = ref<HTMLDivElement>()

const updateContent = () => {
  // Keep content updated
}

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    event.preventDefault()
    cancelText()
  } else if (event.ctrlKey || event.metaKey) {
    if (event.key === 'b') {
      event.preventDefault()
      document.execCommand('bold', false)
    } else if (event.key === 'i') {
      event.preventDefault()
      document.execCommand('italic', false)
    }
  }
}

const cancelText = () => {
  emit('cancel')
  clearEditor()
}

const clearEditor = () => {
  if (textEditor.value) {
    textEditor.value.innerHTML = ''
  }
}

watch(() => props.isVisible, async (visible) => {
  if (visible) {
    await nextTick()
    textEditor.value?.focus()
    // Place cursor at end
    const range = document.createRange()
    const selection = window.getSelection()
    if (textEditor.value && selection) {
      range.selectNodeContents(textEditor.value)
      range.collapse(false)
      selection.removeAllRanges()
      selection.addRange(range)
    }
  }
})
</script>