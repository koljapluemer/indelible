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
          currentTool === 'text' ? 'btn-primary' :
          canvasState === 'text-input' ? 'btn-secondary' : 'btn-ghost'
        ]"
        @click="$emit('toolChanged', 'text')"
        title="Text Tool (T)"
      >
        <Type class="w-5 h-5" />
      </button>

      <!-- Image Tool -->
      <button
        class="btn btn-circle"
        :class="[
          currentTool === 'image' ? 'btn-primary' : 'btn-ghost'
        ]"
        @click="$emit('toolChanged', 'image')"
        title="Image Tool (I)"
      >
        <Image class="w-5 h-5" />
      </button>

      <!-- Line Tool -->
      <button
        class="btn btn-circle"
        :class="[
          currentTool === 'line' ? 'btn-primary' :
          canvasState === 'drawing' ? 'btn-secondary' : 'btn-ghost'
        ]"
        @click="$emit('toolChanged', 'line')"
        title="Line Tool (L)"
      >
        <Minus class="w-5 h-5" />
      </button>

      <!-- Tape Tool -->
      <button
        class="btn btn-circle"
        :class="[
          currentTool === 'tape' ? 'btn-primary' :
          canvasState === 'drawing' ? 'btn-secondary' : 'btn-ghost'
        ]"
        @click="$emit('toolChanged', 'tape')"
        title="Tape Tool (A)"
      >
        <RectangleHorizontal class="w-5 h-5" />
      </button>

      <!-- Draw Tool -->
      <button
        class="btn btn-circle"
        :class="[
          currentTool === 'draw' ? 'btn-primary' :
          canvasState === 'free-drawing' ? 'btn-secondary' : 'btn-ghost'
        ]"
        @click="$emit('toolChanged', 'draw')"
        title="Draw Tool (D)"
      >
        <Pen class="w-5 h-5" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Move, Type, Image, Minus, RectangleHorizontal, Pen } from 'lucide-vue-next'

interface ToolbarProps {
  currentTool: 'pan' | 'text' | 'image' | 'line' | 'tape' | 'draw'
  canvasState: 'idle' | 'text-input' | 'image-workflow' | 'drawing' | 'free-drawing'
}

interface ToolbarEmits {
  toolChanged: [tool: 'pan' | 'text' | 'image' | 'line' | 'tape' | 'draw']
}

defineProps<ToolbarProps>()
defineEmits<ToolbarEmits>()
</script>