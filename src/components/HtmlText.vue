<template>
  <div
    class="html-content text-base-content"
    v-html="sanitizedContent"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface HtmlTextProps {
  content: string
}

const props = defineProps<HtmlTextProps>()

// Basic HTML sanitization - only allow safe formatting tags
const sanitizedContent = computed(() => {
  const allowedTags = ['b', 'strong', 'i', 'em', 'u', 'br', 'p', 'div']
  const allowedTagsRegex = new RegExp(`<(?!/?(?:${allowedTags.join('|')})\\b)[^>]+>`, 'gi')

  return props.content.replace(allowedTagsRegex, '')
})
</script>

<style scoped>
.html-content :deep(b),
.html-content :deep(strong) {
  font-weight: bold;
}

.html-content :deep(i),
.html-content :deep(em) {
  font-style: italic;
}

.html-content :deep(u) {
  text-decoration: underline;
}

.html-content :deep(p) {
  margin-bottom: 0.5rem;
}

.html-content :deep(p:last-child) {
  margin-bottom: 0;
}

.html-content :deep(div) {
  margin-bottom: 0.25rem;
}

.html-content :deep(div:last-child) {
  margin-bottom: 0;
}
</style>