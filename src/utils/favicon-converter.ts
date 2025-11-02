/**
 * Utility functions for converting SVG to multi-size favicon.ico and high-resolution favicon bundles
 */

import JSZip from 'jszip'

export interface IconSize {
  width: number
  height: number
}

export interface FaviconBundle {
  ico: Blob
  pngs: Map<string, Blob>
  manifest: string
  htmlSnippet: string
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
 * Converts a canvas to PNG Blob
 */
export function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Failed to convert canvas to blob'))
          return
        }
        resolve(blob)
      },
      'image/png'
    )
  })
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

/**
 * Generates a complete high-resolution favicon bundle
 */
export async function generateFaviconBundle(svgFile: File): Promise<FaviconBundle> {
  // Define all sizes for the bundle
  const icoSizes: IconSize[] = [
    { width: 16, height: 16 },
    { width: 32, height: 32 },
    { width: 48, height: 48 },
    { width: 64, height: 64 },
    { width: 128, height: 128 },
    { width: 256, height: 256 },
  ]

  const pngSizes = {
    'favicon-16x16.png': { width: 16, height: 16 },
    'favicon-32x32.png': { width: 32, height: 32 },
    'favicon-96x96.png': { width: 96, height: 96 },
    'favicon-192x192.png': { width: 192, height: 192 },
    'favicon-512x512.png': { width: 512, height: 512 },
    'apple-touch-icon.png': { width: 180, height: 180 },
    'android-chrome-192x192.png': { width: 192, height: 192 },
    'android-chrome-512x512.png': { width: 512, height: 512 },
  }

  // Generate ICO file
  const icoBlob = await convertSvgToFavicon(svgFile, icoSizes)

  // Generate PNG files
  const pngs = new Map<string, Blob>()

  for (const [filename, size] of Object.entries(pngSizes)) {
    const canvas = await svgToCanvas(svgFile, size)
    const blob = await canvasToPngBlob(canvas)
    pngs.set(filename, blob)
  }

  // Generate manifest.json
  const manifest = JSON.stringify({
    name: 'App',
    short_name: 'App',
    icons: [
      {
        src: '/android-chrome-192x192.png',
        sizes: '192x192',
        type: 'image/png'
      },
      {
        src: '/android-chrome-512x512.png',
        sizes: '512x512',
        type: 'image/png'
      }
    ],
    theme_color: '#ffffff',
    background_color: '#ffffff',
    display: 'standalone'
  }, null, 2)

  // Generate HTML snippet
  const htmlSnippet = `<!-- Favicon Bundle - Add to your <head> -->
<link rel="icon" type="image/x-icon" href="/favicon.ico">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="96x96" href="/favicon-96x96.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="icon" type="image/png" sizes="192x192" href="/android-chrome-192x192.png">
<link rel="icon" type="image/png" sizes="512x512" href="/android-chrome-512x512.png">
<link rel="manifest" href="/manifest.json">`

  return {
    ico: icoBlob,
    pngs,
    manifest,
    htmlSnippet
  }
}

/**
 * Creates a ZIP file containing the complete favicon bundle
 */
export async function createFaviconBundleZip(svgFile: File): Promise<Blob> {
  const bundle = await generateFaviconBundle(svgFile)
  const zip = new JSZip()

  // Add favicon.ico
  zip.file('favicon.ico', bundle.ico)

  // Add all PNG files
  for (const [filename, blob] of bundle.pngs.entries()) {
    zip.file(filename, blob)
  }

  // Add manifest.json
  zip.file('manifest.json', bundle.manifest)

  // Add README with HTML snippet
  const readme = `# Favicon Bundle

This bundle contains high-resolution favicons for all platforms.

## Files Included:
- favicon.ico (multi-size: 16x16, 32x32, 48x48, 64x64, 128x128, 256x256)
- favicon-16x16.png
- favicon-32x32.png
- favicon-96x96.png
- favicon-192x192.png (for web manifest)
- favicon-512x512.png (for web manifest)
- apple-touch-icon.png (180x180)
- android-chrome-192x192.png
- android-chrome-512x512.png
- manifest.json (Web App Manifest)

## Installation:
1. Copy all files to your website's root directory
2. Add the following code to your HTML <head>:

${bundle.htmlSnippet}

## Notes:
- All PNGs are high-resolution and optimized
- The favicon.ico contains multiple sizes for legacy browser support
- The manifest.json is ready for Progressive Web Apps (PWA)
`

  zip.file('README.md', readme)

  // Generate ZIP blob
  return await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: {
      level: 9
    }
  })
}

