<template>
  <div class="markdown-content text-base-content">
    <VueMarkdownIt
      :source="content"
      :options="markdownOptions"
      :plugins="markdownPlugins"
    />
  </div>
</template>

<script setup lang="ts">
import { VueMarkdownIt } from '@f3ve/vue-markdown-it'

interface MarkdownTextProps {
  content: string
}

defineProps<MarkdownTextProps>()

const markdownOptions = {
  html: false,
  linkify: true,
  typographer: true,
  breaks: true
}

const markdownPlugins: any[] = []
</script>

<style scoped>
.markdown-content :deep(h1),
.markdown-content :deep(h2),
.markdown-content :deep(h3),
.markdown-content :deep(h4),
.markdown-content :deep(h5),
.markdown-content :deep(h6) {
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.markdown-content :deep(h1) {
  font-size: 1.25rem;
  line-height: 1.75rem;
}

.markdown-content :deep(h2) {
  font-size: 1.125rem;
  line-height: 1.75rem;
}

.markdown-content :deep(h3) {
  font-size: 1rem;
  line-height: 1.5rem;
}

.markdown-content :deep(p) {
  margin-bottom: 0.5rem;
}

.markdown-content :deep(p:last-child) {
  margin-bottom: 0;
}

.markdown-content :deep(strong) {
  font-weight: bold;
}

.markdown-content :deep(em) {
  font-style: italic;
}

.markdown-content :deep(code) {
  background-color: #f3f4f6;
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  font-family: ui-monospace, SFMono-Regular, 'SF Mono', Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
}

.markdown-content :deep(pre) {
  background-color: #f3f4f6;
  padding: 0.5rem;
  border-radius: 0.25rem;
  overflow-x: auto;
  margin-bottom: 0.5rem;
}

.markdown-content :deep(pre code) {
  background-color: transparent;
  padding: 0;
}

.markdown-content :deep(a) {
  color: #3b82f6;
  text-decoration: underline;
}

.markdown-content :deep(blockquote) {
  border-left: 4px solid #d1d5db;
  padding-left: 1rem;
  font-style: italic;
  margin-bottom: 0.5rem;
}

.markdown-content :deep(ul),
.markdown-content :deep(ol) {
  margin-left: 1rem;
  margin-bottom: 0.5rem;
}

.markdown-content :deep(li) {
  margin-bottom: 0.25rem;
}
</style>