import { ref, computed } from 'vue'

const viewport = ref({ x: 0, y: 0, scale: 1 })

export function useViewport() {
  // sx/sy are container-relative (clientX - rect.left, clientY - rect.top)
  const screenToCanvas = (sx: number, sy: number) => ({
    x: (sx - viewport.value.x) / viewport.value.scale,
    y: (sy - viewport.value.y) / viewport.value.scale,
  })

  // Returns container-relative screen coords — use for position:absolute overlays inside the canvas area
  const canvasToScreen = (cx: number, cy: number) => ({
    x: cx * viewport.value.scale + viewport.value.x,
    y: cy * viewport.value.scale + viewport.value.y,
  })

  const cssTransform = computed(() =>
    `translate(${viewport.value.x}px, ${viewport.value.y}px) scale(${viewport.value.scale})`
  )

  const setViewport = (v: { x: number; y: number; scale: number }) => {
    viewport.value = v
  }

  return {
    viewport: computed(() => viewport.value),
    setViewport,
    screenToCanvas,
    canvasToScreen,
    cssTransform,
  }
}
