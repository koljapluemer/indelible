<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import InfinitePannableCanvas from './components/InfinitePannableCanvas.vue'
import Toolbar from './components/Toolbar.vue'
import TextInput from './components/TextInput.vue'
import { db, type TextElement } from './stores/database'

const currentTool = ref<'pan' | 'text'>('pan')
const textElements = ref<TextElement[]>([])
const showTextInput = ref(false)
const textInputPosition = ref({ x: 0, y: 0 })
const pendingTextPosition = ref({ x: 0, y: 0 })

const handleToolChange = (tool: 'pan' | 'text') => {
  currentTool.value = tool
  showTextInput.value = false
}

const handleAddText = (x: number, y: number) => {
  if (currentTool.value === 'text') {
    pendingTextPosition.value = { x, y }
    textInputPosition.value = { x: x + 20, y: y + 20 }
    showTextInput.value = true
  }
}

const handleTextConfirm = async (text: string) => {
  const newTextElement: TextElement = {
    x: pendingTextPosition.value.x,
    y: pendingTextPosition.value.y,
    content: text,
    timestamp: Date.now()
  }

  try {
    const id = await db.textElements.add(newTextElement)
    newTextElement.id = id
    textElements.value.push(newTextElement)
  } catch (error) {
    console.error('Failed to save text element:', error)
  }

  showTextInput.value = false
}

const handleTextCancel = () => {
  showTextInput.value = false
}

const handleKeydown = (event: KeyboardEvent) => {
  if (event.code === 'Space' && !showTextInput.value) {
    event.preventDefault()
    currentTool.value = 'pan'
  } else if (event.key === 't' && !showTextInput.value) {
    event.preventDefault()
    currentTool.value = 'text'
  }
}

const loadTextElements = async () => {
  try {
    textElements.value = await db.textElements.orderBy('timestamp').toArray()
  } catch (error) {
    console.error('Failed to load text elements:', error)
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
  loadTextElements()
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div class="h-screen w-screen overflow-hidden bg-base-200" data-theme="light">
    <InfinitePannableCanvas
      :is-pan-mode="currentTool === 'pan'"
      :text-elements="textElements"
      @add-text="handleAddText"
    />

    <Toolbar
      :current-tool="currentTool"
      @tool-changed="handleToolChange"
    />

    <TextInput
      :is-visible="showTextInput"
      :position="textInputPosition"
      @confirm="handleTextConfirm"
      @cancel="handleTextCancel"
    />
  </div>
</template>
