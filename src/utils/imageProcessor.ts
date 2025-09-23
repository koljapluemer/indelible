export interface ProcessedImage {
  data: string
  width: number
  height: number
}

export const processImageFile = async (file: File): Promise<ProcessedImage> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      reject(new Error('Could not get canvas context'))
      return
    }

    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)

      const data = canvas.toDataURL('image/jpeg', 0.85)

      resolve({
        data,
        width: img.width,
        height: img.height
      })

      URL.revokeObjectURL(img.src)
    }

    img.onerror = () => {
      reject(new Error('Failed to load image'))
      URL.revokeObjectURL(img.src)
    }

    img.src = URL.createObjectURL(file)
  })
}

export const extractImageFromClipboard = (event: ClipboardEvent): File | null => {
  const items = event.clipboardData?.items
  if (!items) return null

  for (const item of items) {
    if (item.type.startsWith('image/')) {
      const file = item.getAsFile()
      if (file) return file
    }
  }

  return null
}