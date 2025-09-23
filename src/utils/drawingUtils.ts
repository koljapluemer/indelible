// Drawing utilities for line-based elements (line, tape)

export type DrawingElement = 'line' | 'tape' | 'drawing'

export interface DrawingWorkflow {
  isActive: boolean
  element: DrawingElement
  startX: number
  startY: number
  endX: number
  endY: number
}

export const createDrawingWorkflow = (element: DrawingElement): DrawingWorkflow => ({
  isActive: false,
  element,
  startX: 0,
  startY: 0,
  endX: 0,
  endY: 0
})

export const startDrawing = (
  workflow: DrawingWorkflow,
  element: DrawingElement,
  startX: number,
  startY: number
): DrawingWorkflow => ({
  ...workflow,
  isActive: true,
  element,
  startX,
  startY,
  endX: startX,
  endY: startY
})

export const updateDrawingEnd = (
  workflow: DrawingWorkflow,
  endX: number,
  endY: number
): DrawingWorkflow => ({
  ...workflow,
  endX,
  endY
})

export const finishDrawing = (workflow: DrawingWorkflow): DrawingWorkflow => ({
  ...workflow,
  isActive: false
})

export const cancelDrawing = (workflow: DrawingWorkflow): DrawingWorkflow => ({
  ...workflow,
  isActive: false
})