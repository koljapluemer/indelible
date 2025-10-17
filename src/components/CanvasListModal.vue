<template>
  <div v-if="isVisible" class="modal modal-open">
    <div class="modal-box max-w-2xl">
      <h3 class="font-bold text-lg mb-4">Your Canvases</h3>

      <div v-if="canvases.length === 0" class="text-center py-8 text-base-content/60">
        <p>No canvases yet. Create your first one!</p>
      </div>

      <div v-else>
        <!-- Search Bar -->
        <div class="form-control mb-4">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search canvases..."
            class="input input-bordered w-full"
          />
        </div>

        <div class="overflow-x-auto max-h-96">
        <table class="table table-sm">
          <thead>
            <tr>
              <th>Canvas</th>
              <th>Updated</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="canvas in filteredCanvases"
              :key="canvas.id"
              class="cursor-pointer hover:bg-base-200"
              :class="[
                currentCanvas?.id === canvas.id ? 'bg-primary/10' : ''
              ]"
              @click="$emit('switch', canvas.slug)"
            >
              <td class="font-mono">{{ canvas.slug }}</td>
              <td class="text-sm text-base-content/60">{{ formatDate(canvas.updatedAt) }}</td>
              <td>
                <div v-if="currentCanvas?.id === canvas.id" class="badge badge-primary badge-xs">
                  Current
                </div>
              </td>
              <td>
                <button
                  class="btn btn-ghost btn-xs text-error"
                  @click.stop="$emit('delete', canvas.id!)"
                  title="Delete canvas"
                >
                  <Trash2 class="w-3 h-3" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="modal-action">
        <button class="btn btn-ghost" @click="$emit('close')">
          Close
        </button>
      </div>
    </div>
    <div class="modal-backdrop" @click="$emit('close')"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Trash2 } from 'lucide-vue-next'
import type { Canvas } from '../stores/database'

interface CanvasListModalProps {
  isVisible: boolean
  canvases: Canvas[]
  currentCanvas: Canvas | null
}

interface CanvasListModalEmits {
  close: []
  switch: [slug: string]
  delete: [canvasId: string]
}

const props = defineProps<CanvasListModalProps>()
defineEmits<CanvasListModalEmits>()

const searchQuery = ref('')

// Simple fuzzy search function
const fuzzyMatch = (text: string, query: string): boolean => {
  const textLower = text.toLowerCase()
  const queryLower = query.toLowerCase()

  if (queryLower === '') return true

  let queryIndex = 0
  for (let i = 0; i < textLower.length && queryIndex < queryLower.length; i++) {
    if (textLower[i] === queryLower[queryIndex]) {
      queryIndex++
    }
  }
  return queryIndex === queryLower.length
}

const filteredCanvases = computed(() => {
  if (!searchQuery.value) return props.canvases

  return props.canvases.filter(canvas =>
    fuzzyMatch(canvas.slug, searchQuery.value)
  )
})

const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp)
  const now = new Date()
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

  if (diffInHours < 1) {
    return 'Just now'
  } else if (diffInHours < 24) {
    return `${Math.floor(diffInHours)}h ago`
  } else if (diffInHours < 24 * 7) {
    return `${Math.floor(diffInHours / 24)}d ago`
  } else {
    return date.toLocaleDateString()
  }
}
</script>