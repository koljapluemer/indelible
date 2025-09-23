<template>
  <div class="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
    <div class="flex gap-2 bg-base-100 rounded-full shadow-lg border border-base-300 p-2">
      <!-- Pan Tool -->
      <button
        class="btn btn-circle"
        :class="[
          currentTool === 'pan' ? 'btn-primary' : 'btn-ghost'
        ]"
        @click="$emit('toolChanged', 'pan')"
        title="Pan Tool (Space)"
      >
        <Move class="w-5 h-5" />
      </button>

      <!-- Text Tool -->
      <button
        class="btn btn-circle"
        :class="[
          currentTool === 'text' ? 'btn-primary' : 'btn-ghost'
        ]"
        @click="$emit('toolChanged', 'text')"
        title="Text Tool (T)"
      >
        <Type class="w-5 h-5" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Move, Type } from 'lucide-vue-next'

interface ToolbarProps {
  currentTool: 'pan' | 'text'
}

interface ToolbarEmits {
  toolChanged: [tool: 'pan' | 'text']
}

defineProps<ToolbarProps>()
defineEmits<ToolbarEmits>()
</script>