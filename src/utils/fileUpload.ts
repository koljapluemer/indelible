export const openFileDialog = (): Promise<File | null> => {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'

    input.onchange = (event) => {
      const file = (event.target as HTMLInputElement).files?.[0] || null
      resolve(file)
    }

    input.oncancel = () => {
      resolve(null)
    }

    input.click()
  })
}