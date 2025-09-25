<template>
  <!-- Invisible Tiptap editor positioned exactly where text will appear -->
  <div
    v-if="isVisible"
    class="fixed z-50"
    :style="{
      left: position.x + 'px',
      top: position.y + 'px',
      minWidth: '20px',
      minHeight: '1.5rem'
    }"
  >
    <EditorContent
      v-if="editor"
      :editor="editor"
      class="prose prose-sm text-base-content focus:outline-none max-w-none"
      :style="{
        background: 'transparent',
        border: 'none'
      }"
    />
  </div>
</template>

<script setup lang="ts">
import { watch, nextTick } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import Typography from '@tiptap/extension-typography'

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

const cancelText = () => {
  emit('cancel')
  if (editor.value) {
    editor.value.commands.clearContent()
  }
}

const confirmText = () => {
  if (editor.value) {
    const html = editor.value.getHTML()
    emit('confirm', html)
    editor.value.commands.clearContent()
  }
}

const editor = useEditor({
  extensions: [
    StarterKit,
    Underline,
    Link.configure({
      openOnClick: false,
    }),
    Typography,
  ],
  content: '',
  editorProps: {
    attributes: {
      class: 'focus:outline-none prose prose-sm text-base-content max-w-none',
    },
    handleKeyDown: (_view, event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        cancelText()
        return true
      }
      return false
    },
  },
  editable: false, // Start disabled
})

watch(() => props.isVisible, (visible) => {
  if (editor.value) {
    if (visible) {
      editor.value.setEditable(true)
      nextTick(() => {
        editor.value?.commands.focus('end')
      })
    } else {
      editor.value.setEditable(false)
      editor.value.commands.clearContent()
    }
  }
})

defineExpose({
  confirmText
})
</script>
