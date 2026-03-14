<template>
  <div v-if="isVisible" class="modal modal-open">
    <div class="modal-box max-w-md">
      <h3 class="font-bold text-lg mb-4">Export & Import</h3>

      <!-- Export -->
      <div class="mb-6">
        <p class="text-sm font-semibold mb-3">Export</p>
        <div class="flex flex-col gap-2">
          <button class="btn btn-sm btn-outline w-full" @click="handleExportCurrent" :disabled="!currentCanvas">
            Download current canvas
          </button>
          <button class="btn btn-sm btn-outline w-full" @click="handleExportAll">
            Download all canvases
          </button>
        </div>
      </div>

      <!-- Import -->
      <div class="mb-6">
        <p class="text-sm font-semibold mb-3">Import</p>
        <input
          ref="fileInputRef"
          type="file"
          accept=".json"
          class="hidden"
          @change="handleFileChange"
        />
        <button class="btn btn-sm btn-outline w-full" @click="fileInputRef?.click()">
          Choose file…
        </button>
        <p v-if="importResult" class="text-sm mt-2" :class="importResult.errors.length ? 'text-error' : 'text-success'">
          {{ importResult.errors.length
            ? importResult.errors.join('; ')
            : `Imported ${importResult.imported} canvas(es)` }}
        </p>
      </div>

      <div class="modal-action">
        <button class="btn" @click="$emit('close')">Close</button>
      </div>
    </div>
    <div class="modal-backdrop" @click="$emit('close')"></div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useCanvasManager } from '@/composables/useCanvasManager'
import type { Canvas } from '@/stores/database'

interface SettingsModalProps {
  isVisible: boolean
  currentCanvas: Canvas | null
}

interface SettingsModalEmits {
  close: []
}

defineProps<SettingsModalProps>()
defineEmits<SettingsModalEmits>()

const { exportCurrentCanvas, exportAllCanvases, importCanvases } = useCanvasManager()

const fileInputRef = ref<HTMLInputElement>()
const importResult = ref<{ imported: number; errors: string[] } | null>(null)

const handleExportCurrent = () => exportCurrentCanvas()
const handleExportAll = () => exportAllCanvases()

const handleFileChange = async (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  importResult.value = null
  importResult.value = await importCanvases(file)
  if (fileInputRef.value) fileInputRef.value.value = ''
}
</script>
