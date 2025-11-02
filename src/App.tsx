import { useState, useRef } from 'react'
import { createFaviconBundleZip } from './utils/favicon-converter'
import { Button } from './components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card'
import { ModeToggle } from '@/components/theme-toggle'
import { Download, Upload, Loader2, Package } from 'lucide-react'
import './App.css'

function App() {
  const [svgFile, setSvgFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.type !== 'image/svg+xml' && !file.name.endsWith('.svg')) {
        setError('Please select an SVG file')
        return
      }
      setError(null)
      setSvgFile(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleConvert = async () => {
    if (!svgFile) return

    setIsProcessing(true)
    setError(null)

    try {
      const zipBlob = await createFaviconBundleZip(svgFile)

      // Create download link
      const url = URL.createObjectURL(zipBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'favicon-bundle.zip'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate favicon bundle')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReset = () => {
    setSvgFile(null)
    setPreview(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-white dark:bg-black">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl flex items-center gap-2">
              <Package className="size-6" />
              SVG to Favicon Bundle
            </CardTitle>
            <ModeToggle />
          </div>
          <CardDescription>
            Convert your SVG into a complete high-resolution favicon bundle with all formats and sizes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <input
              id="svg-upload"
              ref={fileInputRef}
              type="file"
              accept=".svg,image/svg+xml"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              variant="outline"
              className="w-full h-20 border-dashed border-2"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="flex flex-col items-center gap-2">
                <Upload className="size-5" />
                <div className="text-sm">
                  {svgFile ? (
                    <span className="font-medium">{svgFile.name}</span>
                  ) : (
                    <span>Click to select SVG file</span>
                  )}
                </div>
              </div>
            </Button>
          </div>

          {preview && (
            <div className="space-y-3">
              <label className="block text-sm font-medium">Preview</label>
              <div className="border rounded-md p-4 bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
                <img
                  src={preview}
                  alt="SVG preview"
                  className="max-w-full max-h-32 object-contain"
                />
              </div>
              <div className="p-3 rounded-md bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
                <p className="text-xs font-medium text-blue-900 dark:text-blue-100 mb-2">
                  Bundle includes:
                </p>
                <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                  <li>• favicon.ico (16×16 to 256×256)</li>
                  <li>• High-res PNGs (up to 512×512)</li>
                  <li>• Apple Touch Icon (180×180)</li>
                  <li>• Android Chrome icons</li>
                  <li>• manifest.json for PWA</li>
                  <li>• README with installation guide</li>
                </ul>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm border border-destructive/20">
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={handleConvert}
              disabled={!svgFile || isProcessing}
              className="flex-1"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Generating Bundle...
                </>
              ) : (
                <>
                  <Download className="size-4" />
                  Download Bundle (.zip)
                </>
              )}
            </Button>
            {svgFile && (
              <Button
                variant="outline"
                onClick={handleReset}
                disabled={isProcessing}
              >
                Reset
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default App
