
'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

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

  useEffect(() => {
    if (!src) {
      setError(true)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(false)
    
    // If it's already a full URL, try to use it directly unless it's a broken S3 URL
    if (src.startsWith('http')) {
      try {
        const u = new URL(src)
        const host = u.host || ''
        // Handle legacy/broken S3 URLs where bucket/region envs were undefined
        if (host.includes('undefined.s3')) {
          const rel = u.pathname.replace(/^\//, '')
          const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://prieelo.com'
          const fallbackUrl = `${baseUrl}/api/uploads/${rel}`
          setImageUrl(fallbackUrl)
          setLoading(false)
          return
        }
      } catch {}

      setImageUrl(src)
      setLoading(false)
      return
    }
    
    // It's a local path, convert to public URL
    console.log(`[LocalImage] Loading image for path: ${src}`)
    
    // Generate URL directly without server-side calls
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://prieelo.com'
    const publicUrl = `${baseUrl}/api/uploads/${src}`
    
    console.log(`[LocalImage] Generated public URL: ${publicUrl}`)
    setImageUrl(publicUrl)
    setLoading(false)
  }, [src])

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
