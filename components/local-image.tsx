
'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { getLocalImageUrl } from '@/lib/image-utils'

interface LocalImageProps {
  src: string // Local path or full URL
  alt: string
  fill?: boolean
  className?: string
  sizes?: string
  width?: number
  height?: number
  priority?: boolean
}

export function LocalImage({ 
  src, 
  alt, 
  fill, 
  className, 
  sizes, 
  width, 
  height, 
  priority 
}: LocalImageProps) {
  const [imageUrl, setImageUrl] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    const loadImage = async () => {
      if (!src) {
        setError(true)
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(false)
        
        // If it's already a full URL, use it directly
        if (src.startsWith('http')) {
          setImageUrl(src)
          setLoading(false)
          return
        }
        
        // It's a local path, convert to public URL
        console.log(`[LocalImage] Loading image for path: ${src}`)
        const publicUrl = await getLocalImageUrl(src)
        
        if (publicUrl) {
          console.log(`[LocalImage] Successfully got public URL for: ${src}`)
          setImageUrl(publicUrl)
        } else {
          console.error(`[LocalImage] Got empty public URL for: ${src}`)
          setError(true)
        }
      } catch (err: any) {
        console.error(`[LocalImage] Error loading image for path ${src}:`, err)
        
        // Retry once after a short delay
        if (retryCount < 1) {
          console.log(`[LocalImage] Retrying in 2 seconds... (attempt ${retryCount + 1})`)
          setTimeout(() => {
            setRetryCount(prev => prev + 1)
          }, 2000)
        } else {
          setError(true)
        }
      } finally {
        if (retryCount >= 1 || error) {
          setLoading(false)
        }
      }
    }

    loadImage()
  }, [src, retryCount])

  if (loading) {
    return (
      <div className={`bg-muted flex items-center justify-center ${className || ''}`}>
        <div className="animate-pulse bg-muted-foreground/20 w-full h-full rounded" />
      </div>
    )
  }

  if (error || !imageUrl) {
    return (
      <div className={`bg-muted flex items-center justify-center ${className || ''}`}>
        <div className="text-muted-foreground text-sm p-4 text-center">
          <p>Failed to load image</p>
          <p className="text-xs mt-1 opacity-60">{src?.substring(0, 50)}...</p>
        </div>
      </div>
    )
  }

  const imageProps = {
    src: imageUrl,
    alt,
    className,
    sizes,
    priority,
    onError: () => {
      console.error(`[LocalImage] Image failed to load from URL: ${imageUrl}`)
      setError(true)
    }
  }

  if (fill) {
    return <Image {...imageProps} fill />
  }

  return (
    <Image 
      {...imageProps} 
      width={width || 500} 
      height={height || 300} 
    />
  )
}
