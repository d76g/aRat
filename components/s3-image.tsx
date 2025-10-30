
'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { getSignedImageUrl } from '@/lib/image-utils'

interface S3ImageProps {
  src: string // S3 key or full URL
  alt: string
  fill?: boolean
  className?: string
  sizes?: string
  width?: number
  height?: number
  priority?: boolean
}

export function S3Image({ 
  src, 
  alt, 
  fill, 
  className, 
  sizes, 
  width, 
  height, 
  priority 
}: S3ImageProps) {
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
        
        // It's an S3 key, convert to signed URL
        console.log(`[S3Image] Loading image for key: ${src}`)
        const signedUrl = await getSignedImageUrl(src)
        
        if (signedUrl) {
          console.log(`[S3Image] Successfully got signed URL for: ${src}`)
          setImageUrl(signedUrl)
        } else {
          console.error(`[S3Image] Got empty signed URL for: ${src}`)
          setError(true)
        }
      } catch (err: any) {
        console.error(`[S3Image] Error loading image for key ${src}:`, err)
        
        // Retry once after a short delay
        if (retryCount < 1) {
          console.log(`[S3Image] Retrying in 2 seconds... (attempt ${retryCount + 1})`)
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
      console.error(`[S3Image] Image failed to load from URL: ${imageUrl}`)
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
