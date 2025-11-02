/**
 * Utility functions for converting SVG to multi-size favicon.ico
 */

export interface IconSize {
  width: number
  height: number
}

/**
 * Converts an SVG file to a canvas at a specific size
 */
export async function svgToCanvas(
  svgFile: File,
  size: IconSize
): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = async (e) => {
      const svgData = e.target?.result as string
      
      // Create an image from the SVG data
      const img = new Image()
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml' })
      const url = URL.createObjectURL(svgBlob)
      
      img.onload = () => {
        // Create canvas and draw the image
        const canvas = document.createElement('canvas')
        canvas.width = size.width
        canvas.height = size.height
        const ctx = canvas.getContext('2d')
        
        if (!ctx) {
          URL.revokeObjectURL(url)
          reject(new Error('Failed to get canvas context'))
          return
        }
        
        // Enable high-quality image rendering
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        
        // Draw the image scaled to the desired size
        ctx.drawImage(img, 0, 0, size.width, size.height)
        URL.revokeObjectURL(url)
        resolve(canvas)
      }
      
      img.onerror = () => {
        URL.revokeObjectURL(url)
        reject(new Error('Failed to load SVG image'))
      }
      
      img.src = url
    }
    
    reader.onerror = () => reject(new Error('Failed to read SVG file'))
    reader.readAsText(svgFile)
  })
}

/**
 * Converts a canvas to PNG data
 */
export function canvasToPng(canvas: HTMLCanvasElement): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Failed to convert canvas to blob'))
          return
        }
        blob.arrayBuffer().then(buffer => {
          resolve(new Uint8Array(buffer))
        })
      },
      'image/png'
    )
  })
}

/**
 * Writes a 32-bit little-endian integer to a DataView
 */
function writeUint32LE(view: DataView, offset: number, value: number): void {
  view.setUint32(offset, value, true)
}

/**
 * Writes a 16-bit little-endian integer to a DataView
 */
function writeUint16LE(view: DataView, offset: number, value: number): void {
  view.setUint16(offset, value, true)
}

/**
 * Writes an 8-bit unsigned integer to a DataView
 */
function writeUint8(view: DataView, offset: number, value: number): void {
  view.setUint8(offset, value)
}

/**
 * Creates an ICO file from multiple PNG images
 * ICO format specification: https://en.wikipedia.org/wiki/ICO_(file_format)
 */
export async function createIcoFile(
  pngDataArray: Array<{ data: Uint8Array; width: number; height: number }>
): Promise<Blob> {
  const numImages = pngDataArray.length
  
  // ICO header: 6 bytes
  // - Reserved (2 bytes) = 0
  // - Type (2 bytes) = 1 (ICO) or 2 (CUR)
  // - Number of images (2 bytes)
  const headerSize = 6
  
  // ICO directory entry: 16 bytes per image
  // - Width (1 byte, 0 = 256)
  // - Height (1 byte, 0 = 256)
  // - Color palette (1 byte, 0 = no palette)
  // - Reserved (1 byte) = 0
  // - Color planes (2 bytes) = 0 or 1
  // - Bits per pixel (2 bytes)
  // - Size of image data (4 bytes)
  // - Offset of image data (4 bytes)
  const directoryEntrySize = 16
  
  // Calculate total PNG data size
  let totalPngSize = 0
  for (const pngData of pngDataArray) {
    totalPngSize += pngData.data.length
  }
  
  // Total file size: header + directory entries + PNG data
  const totalSize = headerSize + (directoryEntrySize * numImages) + totalPngSize
  
  // Create ArrayBuffer for the ICO file
  const buffer = new ArrayBuffer(totalSize)
  const view = new DataView(buffer)
  
  // Write ICO header
  writeUint16LE(view, 0, 0) // Reserved
  writeUint16LE(view, 2, 1) // Type: ICO
  writeUint16LE(view, 4, numImages) // Number of images
  
  // Calculate offsets
  let currentOffset = headerSize + (directoryEntrySize * numImages)
  
  // Write directory entries
  for (let i = 0; i < numImages; i++) {
    const pngData = pngDataArray[i]
    const entryOffset = headerSize + (i * directoryEntrySize)
    
    // Width and height (0 = 256)
    writeUint8(view, entryOffset, pngData.width === 256 ? 0 : pngData.width)
    writeUint8(view, entryOffset + 1, pngData.height === 256 ? 0 : pngData.height)
    writeUint8(view, entryOffset + 2, 0) // Color palette
    writeUint8(view, entryOffset + 3, 0) // Reserved
    writeUint16LE(view, entryOffset + 4, 0) // Color planes (or 1)
    writeUint16LE(view, entryOffset + 6, 32) // Bits per pixel (32 = RGBA)
    writeUint32LE(view, entryOffset + 8, pngData.data.length) // Size of image data
    writeUint32LE(view, entryOffset + 12, currentOffset) // Offset of image data
    
    currentOffset += pngData.data.length
  }
  
  // Copy PNG data into the buffer
  const uint8Array = new Uint8Array(buffer)
  let dataOffset = headerSize + (directoryEntrySize * numImages)
  for (const pngData of pngDataArray) {
    uint8Array.set(pngData.data, dataOffset)
    dataOffset += pngData.data.length
  }
  
  return new Blob([buffer], { type: 'image/x-icon' })
}

/**
 * Main function to convert SVG to multi-size favicon.ico
 */
export async function convertSvgToFavicon(
  svgFile: File,
  sizes: IconSize[] = [
    { width: 16, height: 16 },
    { width: 32, height: 32 },
    { width: 48, height: 48 },
  ]
): Promise<Blob> {
  // Convert SVG to canvas at each size
  const canvasPromises = sizes.map(size => svgToCanvas(svgFile, size))
  const canvases = await Promise.all(canvasPromises)
  
  // Convert each canvas to PNG
  const pngPromises = canvases.map(canvas => canvasToPng(canvas))
  const pngDataArray = await Promise.all(pngPromises)
  
  // Create ICO file from PNGs
  const icoData = await Promise.all(
    pngDataArray.map(async (pngData, index) => ({
      data: pngData,
      width: sizes[index].width,
      height: sizes[index].height,
    }))
  )
  
  return createIcoFile(icoData)
}

