import { ref } from 'vue'
import { useCanvasManager } from './useCanvasManager'

const isActive = ref(false)
const screenPosition = ref({ x: 0, y: 0 })  // clientX/Y — for position:fixed TextInput
const canvasPosition = ref({ x: 0, y: 0 })  // canvas coords — for element storage

export function useTextWorkflow() {
  const { addTextElement } = useCanvasManager()

  const start = (canvasX: number, canvasY: number, clientX: number, clientY: number) => {
    canvasPosition.value = { x: canvasX, y: canvasY }
    screenPosition.value = { x: clientX, y: clientY }
    isActive.value = true
  }

  const confirm = async (html: string): Promise<void> => {
    await addTextElement(canvasPosition.value.x, canvasPosition.value.y, html)
    isActive.value = false
  }

  const cancel = () => {
    isActive.value = false
  }

  return { isActive, screenPosition, start, confirm, cancel }
}
