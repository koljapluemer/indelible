<template>
  <aside class="flex flex-col h-full w-48 shrink-0 bg-base-100 border-r border-base-200">

    <!-- Canvas list -->
    <div class="flex flex-col flex-1 min-h-0 p-2 gap-1">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search…"
        class="input input-xs w-full"
      />
      <div class="flex-1 overflow-y-auto">
        <div v-if="canvases.length === 0" class="text-xs text-base-content/40 px-1 py-2">
          No canvases yet
        </div>
        <div
          v-for="canvas in filteredCanvases"
          :key="canvas.id"
          class="flex items-center justify-between w-full px-2 py-1 rounded cursor-pointer group"
          :class="currentCanvas?.id === canvas.id
            ? 'bg-primary/10 font-semibold'
            : 'hover:bg-base-200'"
          @click="handleSwitch(canvas.slug)"
        >
          <span class="font-mono text-xs truncate">{{ canvas.slug }}</span>
          <button
            class="opacity-0 group-hover:opacity-100 text-error shrink-0 ml-1"
            @click.stop="handleDelete(canvas.id!)"
            title="Delete"
          >
            <Trash2 class="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>

    <!-- New canvas -->
    <div class="shrink-0 border-t border-base-200 p-2">
      <form class="flex gap-1" @submit.prevent="handleCreate">
        <input
          ref="newSlugInputRef"
          v-model="newSlug"
          type="text"
          placeholder="new-canvas"
          class="input input-xs flex-1 min-w-0"
          :class="newSlug && !isValidNewSlug ? 'input-error' : ''"
        />
        <button
          type="submit"
          class="btn btn-xs btn-primary shrink-0"
          :disabled="!isValidNewSlug"
        >
          <Plus class="w-3 h-3" />
        </button>
      </form>
    </div>

    <!-- Export / Import -->
    <div class="shrink-0 border-t border-base-200 p-2 flex flex-col gap-1">
      <button
        class="btn btn-xs btn-ghost justify-start w-full"
        :disabled="!currentCanvas"
        @click="exportCurrentCanvas()"
      >
        <Download class="w-3 h-3" /> current
      </button>
      <button
        class="btn btn-xs btn-ghost justify-start w-full"
        @click="exportAllCanvases()"
      >
        <Download class="w-3 h-3" /> all
      </button>
      <button
        class="btn btn-xs btn-ghost justify-start w-full"
        @click="importFileRef?.click()"
      >
        <Upload class="w-3 h-3" /> import
      </button>
      <input ref="importFileRef" type="file" accept=".json" class="hidden" @change="handleImport" />
      <p v-if="importResult" class="text-xs mt-0.5" :class="importResult.errors.length ? 'text-error' : 'text-success'">
        {{ importResult.errors.length ? importResult.errors[0] : `Imported ${importResult.imported}` }}
      </p>
    </div>

  </aside>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Trash2, Plus, Download, Upload } from 'lucide-vue-next'
import { useCanvasManager } from '@/composables/useCanvasManager'

const {
  canvases,
  currentCanvas,
  switchCanvas,
  deleteCanvas,
  createCanvas,
  exportCurrentCanvas,
  exportAllCanvases,
  importCanvases
} = useCanvasManager()

const searchQuery = ref('')
const newSlug = ref('')
const newSlugInputRef = ref<HTMLInputElement>()
const importFileRef = ref<HTMLInputElement>()
const importResult = ref<{ imported: number; errors: string[] } | null>(null)

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

const isValidNewSlug = computed(() => /^[a-zA-Z0-9-]+$/.test(newSlug.value))

const handleSwitch = async (slug: string) => {
  await switchCanvas(slug)
}

const handleDelete = async (canvasId: string) => {
  if (confirm('Delete this canvas? This cannot be undone.')) {
    await deleteCanvas(canvasId)
  }
}

const handleCreate = async () => {
  if (!isValidNewSlug.value) return
  const ok = await createCanvas(newSlug.value)
  if (ok) {
    newSlug.value = ''
  } else {
    alert('Slug already exists or is invalid.')
  }
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
