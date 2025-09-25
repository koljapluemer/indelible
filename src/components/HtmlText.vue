<template>
  <div
    class="prose prose-sm text-base-content max-w-none"
    v-html="sanitizedContent"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface HtmlTextProps {
  content: string
}

const props = defineProps<HtmlTextProps>()

// Enhanced HTML sanitization for markdown-style content
const sanitizedContent = computed(() => {
  const allowedTags = [
    'p', 'br', 'div',
    'strong', 'b', 'em', 'i', 'u',
    'ul', 'ol', 'li',
    'blockquote',
    'a',
    'code',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6'
  ]
  const allowedTagsRegex = new RegExp(`<(?!/?(?:${allowedTags.join('|')})\\b)[^>]+>`, 'gi')

  return props.content.replace(allowedTagsRegex, '')
})
</script>