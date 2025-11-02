import { useState, useRef } from 'react'
import { convertSvgToFavicon } from './utils/favicon-converter'
import { Button } from './components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card'
import { Input } from './components/ui/input'
import { ModeToggle } from '@/components/theme-toggle'
import { Download, Upload, Loader2 } from 'lucide-react'
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
      const icoBlob = await convertSvgToFavicon(svgFile)
      
      // Create download link
      const url = URL.createObjectURL(icoBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'favicon.ico'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to convert SVG to favicon')
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-white dark:bg-black">
      <div className="absolute top-4 right-4">
        <ModeToggle />
      </div>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">SVG to Favicon Converter</CardTitle>
          <CardDescription>
            Convert your SVG into a multi-size favicon.ico (16×16, 32×32, 48×48)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="svg-upload" className="block text-sm font-medium">
              Select SVG File
            </label>
            <div className="flex gap-2">
              <Input
                id="svg-upload"
                ref={fileInputRef}
                type="file"
                accept=".svg,image/svg+xml"
                onChange={handleFileSelect}
                className="flex-1"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                aria-label="Upload SVG"
              >
                <Upload className="size-4" />
              </Button>
            </div>
          </div>

          {preview && (
            <div className="space-y-2">
              <label className="block text-sm font-medium">Preview</label>
              <div className="border rounded-md p-4 bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
                <img
                  src={preview}
                  alt="SVG preview"
                  className="max-w-full max-h-32 object-contain"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Sizes: 16×16, 32×32, 48×48
              </p>
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
                  Processing...
                </>
              ) : (
                <>
                  <Download className="size-4" />
                  Generate & Download
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
