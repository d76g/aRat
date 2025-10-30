
'use client'

import React, { useState, useRef, useCallback } from 'react'
import ReactCrop, {
  centerCrop,
  makeAspectCrop,
  Crop,
  PixelCrop,
  convertToPixelCrop,
} from 'react-image-crop'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { RotateCw, ZoomIn, ZoomOut, Move, Crop as CropIcon } from 'lucide-react'
import 'react-image-crop/dist/ReactCrop.css'

interface ImageCropperProps {
  src: string
  onCropComplete: (croppedImage: Blob, croppedImageUrl: string) => void
  onCancel: () => void
  aspectRatio?: number
  minWidth?: number
  minHeight?: number
}

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspectRatio: number,
) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspectRatio,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  )
}

export default function ImageCropper({
  src,
  onCropComplete,
  onCancel,
  aspectRatio,
  minWidth = 100,
  minHeight = 100,
}: ImageCropperProps) {
  const imgRef = useRef<HTMLImageElement>(null)
  const [crop, setCrop] = useState<Crop>()
  const [scale, setScale] = useState(1)
  const [rotate, setRotate] = useState(0)
  const [aspect, setAspect] = useState<number | undefined>(aspectRatio || 4/3)

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const targetAspectRatio = aspectRatio || 4/3
    const { width, height } = e.currentTarget
    setCrop(centerAspectCrop(width, height, targetAspectRatio))
  }, [aspectRatio])

  const getCroppedImg = useCallback(
    async (image: HTMLImageElement, pixelCrop: PixelCrop): Promise<Blob> => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      if (!ctx) {
        throw new Error('No 2d context')
      }

      const scaleX = image.naturalWidth / image.width
      const scaleY = image.naturalHeight / image.height

      canvas.width = Math.floor(pixelCrop.width * scaleX)
      canvas.height = Math.floor(pixelCrop.height * scaleY)

      ctx.scale(scaleX, scaleY)
      ctx.imageSmoothingQuality = 'high'

      const cropX = pixelCrop.x
      const cropY = pixelCrop.y

      ctx.save()

      ctx.translate(-cropX, -cropY)
      ctx.rotate((rotate * Math.PI) / 180)
      ctx.scale(scale, scale)
      ctx.drawImage(image, 0, 0)

      ctx.restore()

      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          if (!blob) {
            throw new Error('Failed to create blob')
          }
          resolve(blob)
        }, 'image/jpeg', 0.95)
      })
    },
    [scale, rotate]
  )

  const handleCropComplete = useCallback(async () => {
    if (!imgRef.current || !crop) {
      return
    }

    try {
      const pixelCrop = convertToPixelCrop(
        crop,
        imgRef.current.width,
        imgRef.current.height,
      )
      
      const croppedImage = await getCroppedImg(imgRef.current, pixelCrop)
      const croppedImageUrl = URL.createObjectURL(croppedImage)
      
      onCropComplete(croppedImage, croppedImageUrl)
    } catch (error) {
      console.error('Error cropping image:', error)
    }
  }, [crop, getCroppedImg, onCropComplete])

  const resetTransforms = () => {
    setScale(1)
    setRotate(0)
  }

  const handleRotate = () => {
    setRotate((prev) => (prev + 90) % 360)
  }

  return (
    <Dialog open={true} onOpenChange={() => onCancel()}>
      <DialogContent className="max-w-4xl sm:max-h-[90vh] h-full overflow-hidden p-0">
        <div className="flex flex-col h-full max-h-[calc(100vh-2rem)] sm:max-h-[85vh]">
          {/* Header - Fixed */}
          <DialogHeader className="px-4 sm:px-6 py-4 border-b bg-background flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <CropIcon className="h-5 w-5" />
              Crop Your Image
            </DialogTitle>
          </DialogHeader>
          
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 sm:p-6 space-y-4">
              {/* Controls */}
              <div className="space-y-4 p-3 sm:p-4 bg-muted rounded-lg">
                <div className="flex flex-col sm:flex-row sm:items-center sm:flex-wrap gap-3 sm:gap-4">
                  <div className="flex items-center space-x-2 min-w-0 flex-1 sm:min-w-[200px]">
                    <ZoomOut className="h-4 w-4 flex-shrink-0" />
                    <Label className="text-sm font-medium flex-shrink-0">Zoom:</Label>
                    <Slider
                      value={[scale]}
                      onValueChange={(value) => setScale(value[0])}
                      min={0.5}
                      max={3}
                      step={0.1}
                      className="flex-1"
                    />
                    <ZoomIn className="h-4 w-4 flex-shrink-0" />
                    <span className="text-sm font-mono min-w-[3rem] flex-shrink-0">{scale.toFixed(1)}x</span>
                  </div>
                  
                  <div className="flex gap-2 sm:gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRotate}
                      className="flex items-center gap-2 flex-1 sm:flex-none"
                    >
                      <RotateCw className="h-4 w-4" />
                      <span className="sm:inline">Rotate</span>
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={resetTransforms}
                      className="flex items-center gap-2 flex-1 sm:flex-none"
                    >
                      <span className="sm:inline">Reset</span>
                    </Button>
                  </div>
                </div>
              </div>

              {/* Crop Area */}
              <div className="flex justify-center min-h-[40vh] max-h-[50vh] sm:max-h-[60vh] overflow-auto bg-muted/30 rounded-lg p-2">
                <ReactCrop
                  crop={crop}
                  onChange={(_, percentCrop) => setCrop(percentCrop)}
                  onComplete={(c) => setCrop(c)}
                  aspect={aspect}
                  minWidth={minWidth}
                  minHeight={minHeight}
                  keepSelection={true}
                  className="max-w-full h-full flex items-center justify-center"
                >
                  <img
                    ref={imgRef}
                    alt="Crop preview"
                    src={src}
                    style={{
                      transform: `scale(${scale}) rotate(${rotate}deg)`,
                      maxWidth: '100%',
                      maxHeight: '100%',
                      objectFit: 'contain',
                    }}
                    onLoad={onImageLoad}
                    className="block"
                  />
                </ReactCrop>
              </div>

              {/* Aspect Ratio - Fixed to Feed Display */}
              <div className="space-y-2 p-3 sm:p-4 bg-muted rounded-lg">
                <Label className="text-sm font-medium">Aspect Ratio (Feed Standard):</Label>
                <div className="flex gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    className="text-xs sm:text-sm cursor-default"
                    disabled
                  >
                    4:3 - Feed Display
                  </Button>
                  <p className="text-xs text-muted-foreground flex items-center">
                    This ratio matches how your image will appear in the feed
                  </p>
                </div>
              </div>

              {/* Instructions */}
              <div className="text-sm text-muted-foreground bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Move className="h-4 w-4 flex-shrink-0" />
                  <span className="font-medium">How to crop:</span>
                </div>
                <ul className="space-y-1 text-xs ml-6">
                  <li>• Drag corners to resize the crop area</li>
                  <li>• Drag inside the crop area to move it around</li>
                  <li>• Use zoom slider to get closer to your subject</li>
                  <li>• Rotate the image if needed</li>
                  <li>• Choose an aspect ratio or crop freely</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Footer - Fixed */}
          <DialogFooter className="px-4 sm:px-6 py-4 border-t bg-background flex-shrink-0">
            <div className="flex flex-col-reverse sm:flex-row gap-2 w-full sm:w-auto sm:justify-end">
              <Button variant="outline" onClick={onCancel} className="w-full sm:w-auto">
                Cancel
              </Button>
              <Button 
                onClick={handleCropComplete}
                disabled={!crop}
                className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
              >
                <CropIcon className="h-4 w-4 mr-2" />
                Crop & Use Image
              </Button>
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
