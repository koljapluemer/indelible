<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Plus, List } from 'lucide-vue-next'
import InfinitePannableCanvas from './components/InfinitePannableCanvas.vue'
import Toolbar from './components/Toolbar.vue'
import TextInput from './components/TextInput.vue'
import NewCanvasModal from './components/NewCanvasModal.vue'
import CanvasListModal from './components/CanvasListModal.vue'
import { useCanvasManager } from './composables/useCanvasManager'

const currentTool = ref<'pan' | 'text'>('pan')
const showTextInput = ref(false)
const textInputPosition = ref({ x: 0, y: 0 })
const pendingTextPosition = ref({ x: 0, y: 0 })
const showNewCanvasModal = ref(false)
const showCanvasListModal = ref(false)

const canvasManager = useCanvasManager()

const handleToolChange = (tool: 'pan' | 'text') => {
  currentTool.value = tool
  showTextInput.value = false
}

const handleAddText = (canvasX: number, canvasY: number, screenX: number, screenY: number) => {
  if (currentTool.value === 'text') {
    pendingTextPosition.value = { x: canvasX, y: canvasY }
    textInputPosition.value = { x: screenX, y: screenY }
    showTextInput.value = true
  }
}

const handleTextConfirm = async (text: string) => {
  const success = await canvasManager.addTextElement(
    pendingTextPosition.value.x,
    pendingTextPosition.value.y,
    text
  )

  if (!success) {
    console.error('Failed to add text element')
  }

  showTextInput.value = false
}

const handleTextCancel = () => {
  showTextInput.value = false
}

const handleCreateCanvas = async (slug: string) => {
  const success = await canvasManager.createCanvas(slug)
  if (!success) {
    alert('Failed to create canvas. Slug might already exist or be invalid.')
  }
  showNewCanvasModal.value = false
}

const handleSwitchCanvas = async (slug: string) => {
  const success = await canvasManager.switchCanvas(slug)
  if (!success) {
    alert('Failed to switch to canvas')
  }
  showCanvasListModal.value = false
}

const handleDeleteCanvas = async (canvasId: number) => {
  if (confirm('Are you sure you want to delete this canvas? This action cannot be undone.')) {
    const success = await canvasManager.deleteCanvas(canvasId)
    if (!success) {
      alert('Failed to delete canvas')
    }
  }
}

const handleKeydown = (event: KeyboardEvent) => {
  // Don't handle shortcuts if user is typing in an input
  const isTyping = event.target instanceof HTMLInputElement ||
                   event.target instanceof HTMLTextAreaElement ||
                   (event.target as Element)?.isContentEditable

  if (event.code === 'Space' && !showTextInput.value && !isTyping) {
    event.preventDefault()
    currentTool.value = 'pan'
  } else if (event.key === 't' && !showTextInput.value && !isTyping) {
    event.preventDefault()
    currentTool.value = 'text'
  }
}

onMounted(async () => {
  document.addEventListener('keydown', handleKeydown)

  const hasCanvas = await canvasManager.initializeFromUrl()
  if (!hasCanvas) {
    // No canvases exist, show the new canvas modal
    showNewCanvasModal.value = true
  }
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div class="h-screen w-screen overflow-hidden bg-base-200" data-theme="light">
    <!-- Canvas Management Header -->
    <div class="fixed top-4 left-4 z-50">
      <div class="flex items-center gap-3 bg-base-100 p-2 rounded-lg shadow-lg">
        <button
          class="btn btn-sm btn-primary"
          @click="showNewCanvasModal = true"
          title="New Canvas"
        >
          <Plus class="w-4 h-4" />
        </button>
        <button
          class="btn btn-sm btn-ghost"
          @click="showCanvasListModal = true"
          title="Canvas List"
        >
          <List class="w-4 h-4" />
        </button>
        <div v-if="canvasManager.currentCanvas.value" class="divider divider-horizontal mx-0"></div>
        <span v-if="canvasManager.currentCanvas.value" class="text-sm font-mono">
          {{ canvasManager.currentCanvas.value.slug }}
        </span>
      </div>
    </div>

    <InfinitePannableCanvas
      :is-pan-mode="currentTool === 'pan'"
      :text-elements="canvasManager.textElements.value"
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

    <!-- Modals -->
    <NewCanvasModal
      :is-visible="showNewCanvasModal"
      @close="showNewCanvasModal = false"
      @create="handleCreateCanvas"
    />

    <CanvasListModal
      :is-visible="showCanvasListModal"
      :canvases="canvasManager.canvases.value"
      :current-canvas="canvasManager.currentCanvas.value"
      @close="showCanvasListModal = false"
      @switch="handleSwitchCanvas"
      @delete="handleDeleteCanvas"
    />
  </div>
</template>
