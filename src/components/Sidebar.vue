<template>
  <aside class="flex flex-col h-full w-48 shrink-0 bg-base-100 border-r border-base-200">

    <!-- Canvas list -->
    <div class="flex flex-col flex-1 min-h-0 p-2 gap-1">
      <input v-model="searchQuery" type="text" placeholder="Search…" class="input input-xs w-full" />
      <div class="flex-1 overflow-y-auto">
        <div v-if="canvases.length === 0" class="text-xs text-base-content/40 px-1 py-2">
          No canvases yet
        </div>
        <div v-for="canvas in filteredCanvases" :key="canvas.id"
          class="flex items-center justify-between w-full px-2 py-1 rounded group"
          :class="currentCanvas?.id === canvas.id ? 'bg-primary/10 font-semibold' : 'hover:bg-base-200'">
          <!-- Edit mode -->
          <input
            v-if="editingId === canvas.id"
            ref="editInputRef"
            v-model="editingSlug"
            class="input input-xs flex-1 min-w-0"
            @keydown.enter.prevent="commitEdit(canvas.id!)"
            @keydown.escape.prevent="cancelEdit"
            @blur="commitEdit(canvas.id!)"
            @click.stop
          />
          <!-- Display mode -->
          <template v-else>
            <span class="font-mono text-xs truncate flex-1 cursor-pointer" @click="handleSwitch(canvas.slug)">{{ canvas.slug }}</span>
            <div class="opacity-0 group-hover:opacity-100 flex items-center shrink-0 ml-1 gap-0.5">
              <button @click.stop="startEdit(canvas)" title="Rename">
                <Pencil class="w-3 h-3" />
              </button>
              <button class="text-error" @click.stop="handleDelete(canvas.id!)" title="Delete">
                <Trash2 class="w-3 h-3" />
              </button>
            </div>
          </template>
        </div>
      </div>
    </div>

    <!-- New canvas -->
    <div class="shrink-0 border-t border-base-200 p-2">
      <form class="flex gap-1" @submit.prevent="handleCreate">
        <input ref="newSlugInputRef" v-model="newSlug" type="text" placeholder="new-canvas"
          class="input input-xs flex-1 min-w-0" />
        <button type="submit" class="btn btn-xs btn-primary shrink-0" :disabled="!newSlug.trim()">
          <Plus class="w-3 h-3" />
        </button>
      </form>
    </div>

    <!-- Export / Import -->
    <div class="shrink-0 border-t border-base-200 p-2 flex flex-col gap-1">
      <button class="btn btn-xs justify-start w-full" :disabled="!currentCanvas"
        @click="exportCurrentCanvas()">
        <Download class="w-3 h-3" /> current
      </button>
      <button class="btn btn-xs justify-start w-full" @click="exportAllCanvases()">
        <Download class="w-3 h-3" /> all
      </button>
      <button class="btn btn-xs justify-start w-full" @click="importFileRef?.click()">
        <Upload class="w-3 h-3" /> import
      </button>
      <input ref="importFileRef" type="file" accept=".json" class="hidden" @change="handleImport" />
      <p v-if="importResult" class="text-xs mt-0.5" :class="importResult.errors.length ? 'text-error' : 'text-success'">
        {{ importResult.errors.length ? importResult.errors[0] : `Imported ${importResult.imported}` }}
      </p>
      <hr>
      <aside class="text-xs">
        <p>
          Made by
          <a class="link" href="https://koljasam.com/" target="_blank">Kolja Sam</a>.
        </p>

        <p class="text-base-content/90">
          All data saved on your local device.
        </p>

        <p>Support my work on <a href="https://ko-fi.com/S6S81CWUVD" target="_blank"
            rel="noopener" class="link">
            ko-fi
          </a>.</p>
      </aside>
    </div>

  </aside>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { Trash2, Plus, Download, Upload, Pencil } from 'lucide-vue-next'
import { useCanvasManager } from '@/composables/useCanvasManager'
import type { Canvas } from '@/stores/database'

const {
  canvases,
  currentCanvas,
  switchCanvas,
  deleteCanvas,
  createCanvas,
  renameCanvas,
  exportCurrentCanvas,
  exportAllCanvases,
  importCanvases
} = useCanvasManager()

const searchQuery = ref('')
const newSlug = ref('')
const newSlugInputRef = ref<HTMLInputElement>()
const importFileRef = ref<HTMLInputElement>()
const importResult = ref<{ imported: number; errors: string[] } | null>(null)

const editingId = ref<string | null>(null)
const editingSlug = ref('')
const editInputRef = ref<HTMLInputElement[]>([])

const fuzzyMatch = (text: string, query: string): boolean => {
  const t = text.toLowerCase()
  const q = query.toLowerCase()
  if (!q) return true
  let qi = 0
  for (let i = 0; i < t.length && qi < q.length; i++) {
    if (t[i] === q[qi]) qi++
  }
  return qi === q.length
}

const filteredCanvases = computed(() =>
  searchQuery.value ? canvases.value.filter(c => fuzzyMatch(c.slug, searchQuery.value)) : canvases.value
)

const handleSwitch = async (slug: string) => {
  await switchCanvas(slug)
}

const handleDelete = async (canvasId: string) => {
  if (confirm('Delete this canvas? This cannot be undone.')) {
    await deleteCanvas(canvasId)
  }
}

const handleCreate = async () => {
  if (!newSlug.value.trim()) return
  const ok = await createCanvas(newSlug.value)
  if (ok) {
    newSlug.value = ''
  } else {
    alert('A canvas with that name already exists.')
  }
}

const startEdit = async (canvas: Canvas) => {
  editingId.value = canvas.id!
  editingSlug.value = canvas.slug
  await nextTick()
  const el = editInputRef.value[0]
  el?.focus()
  el?.select()
}

const cancelEdit = () => {
  editingId.value = null
  editingSlug.value = ''
}

const commitEdit = async (canvasId: string) => {
  if (editingId.value !== canvasId) return
  const trimmed = editingSlug.value.trim()
  editingId.value = null
  editingSlug.value = ''
  if (!trimmed) return
  const ok = await renameCanvas(canvasId, trimmed)
  if (!ok) alert('A canvas with that name already exists.')
}

const handleImport = async (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  importResult.value = null
  importResult.value = await importCanvases(file)
  if (importFileRef.value) importFileRef.value.value = ''
}

defineExpose({ focusNewSlug: () => newSlugInputRef.value?.focus() })
</script>
