<template>
  <div
    v-if="isVisible"
    class="fixed z-50"
    :style="{
      left: position.x + 'px',
      top: position.y + 'px',
    }"
  >
    <!-- Formatting toolbar -->
    <div class="mb-2 flex gap-1">
      <button
        @click="toggleBold"
        class="btn btn-xs"
        :class="{ 'btn-primary': isBold }"
        title="Bold (Ctrl+B)"
      >
        <strong>B</strong>
      </button>
      <button
        @click="toggleItalic"
        class="btn btn-xs"
        :class="{ 'btn-primary': isItalic }"
        title="Italic (Ctrl+I)"
      >
        <em>I</em>
      </button>
      <button
        @click="confirmText"
        class="btn btn-xs btn-primary ml-2"
      >
        Save
      </button>
      <button
        @click="cancelText"
        class="btn btn-xs btn-ghost"
      >
        Cancel
      </button>
    </div>

    <!-- Contenteditable text area -->
    <div
      ref="textEditor"
      contenteditable="true"
      class="min-w-32 min-h-6 p-2 bg-base-100 border-2 border-primary rounded text-base-content focus:outline-none"
      style="max-width: 300px; word-wrap: break-word;"
      @keydown="handleKeydown"
      @input="updateContent"
      @blur="handleBlur"
    />
  </div>
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
const isBold = ref(false)
const isItalic = ref(false)

const toggleBold = () => {
  document.execCommand('bold', false)
  updateFormatStates()
}

const toggleItalic = () => {
  document.execCommand('italic', false)
  updateFormatStates()
}

const updateFormatStates = () => {
  isBold.value = document.queryCommandState('bold')
  isItalic.value = document.queryCommandState('italic')
}

const updateContent = () => {
  updateFormatStates()
}

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    confirmText()
  } else if (event.key === 'Escape') {
    event.preventDefault()
    cancelText()
  } else if (event.ctrlKey || event.metaKey) {
    if (event.key === 'b') {
      event.preventDefault()
      toggleBold()
    } else if (event.key === 'i') {
      event.preventDefault()
      toggleItalic()
    }
  }
}

const handleBlur = (event: FocusEvent) => {
  // Don't close if clicking on toolbar buttons
  const relatedTarget = event.relatedTarget as HTMLElement
  if (relatedTarget?.closest('.btn')) {
    return
  }
  confirmText()
}

const confirmText = () => {
  const html = textEditor.value?.innerHTML || ''
  if (html.trim() && html !== '<br>') {
    emit('confirm', html.trim())
  } else {
    emit('cancel')
  }
  clearEditor()
}

const cancelText = () => {
  emit('cancel')
  clearEditor()
}

const clearEditor = () => {
  if (textEditor.value) {
    textEditor.value.innerHTML = ''
  }
  isBold.value = false
  isItalic.value = false
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