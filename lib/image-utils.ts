
// Cache for public URLs to avoid regenerating them frequently
const publicUrlCache = new Map<string, { url: string, expires: number }>()

export async function getLocalImageUrl(localPath: string): Promise<string> {
  if (!localPath) {
    console.warn('getLocalImageUrl called with empty localPath')
    return ''
  }
  
  // If it's already a full URL, return as is
  if (localPath.startsWith('http')) {
    return localPath
  }
  
  // Check cache first (valid for 24 hours since URLs don't expire)
  const cached = publicUrlCache.get(localPath)
  if (cached && Date.now() < cached.expires) {
    console.log(`Using cached public URL for: ${localPath}`)
    return cached.url
  }
  
  try {
    console.log(`Generating public URL for: ${localPath}`)
    
    // Generate public URL without using server-side fs module
    const baseUrl = process.env.BASE_URL || (typeof window !== 'undefined' ? window.location.origin : 'https://prieelo.com')
    const publicUrl = `${baseUrl}/api/uploads/${localPath}`
    
    if (!publicUrl) {
      throw new Error('Failed to generate public URL')
    }
    
    // Cache for 24 hours (URLs don't expire but we cache to avoid repeated calls)
    publicUrlCache.set(localPath, {
      url: publicUrl,
      expires: Date.now() + (24 * 60 * 60 * 1000)
    })
    
    console.log(`Generated public URL successfully for: ${localPath}`)
    return publicUrl
  } catch (error) {
    console.error('Error generating public URL for path:', localPath, error)
    
    // Clear cache entry if it exists
    publicUrlCache.delete(localPath)
    
    throw error
  }
}

export async function getLocalImageUrls(localPaths: string[]): Promise<string[]> {
  if (!localPaths || localPaths.length === 0) return []
  
  // Process in parallel but handle errors individually
  const results = await Promise.allSettled(
    localPaths.map(path => getLocalImageUrl(path))
  )
  
  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value
    } else {
      console.error(`Failed to get public URL for path ${localPaths[index]}:`, result.reason)
      return '' // Return empty string for failed URLs
    }
  })
}

// Helper function to clear cache
export function clearImageUrlCache() {
  publicUrlCache.clear()
}

// Helper function to clear specific cache entry
export function clearImageUrlCacheForPath(path: string) {
  publicUrlCache.delete(path)
}

/**
 * Resizes and crops an image file to a 4:3 aspect ratio
 * This function must be called from the browser (client-side only)
 * @param file - The image file to process
 * @param targetWidth - Target width in pixels (default: 1200)
 * @returns Promise resolving to a Blob with the processed image
 */
export async function resizeImageTo4x3(
  file: File,
  targetWidth: number = 1200
): Promise<Blob> {
  // Ensure we're in a browser environment
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new Error('resizeImageTo4x3 can only be called from the browser')
  }

  return new Promise((resolve, reject) => {
    const img = new Image()
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      reject(new Error('Could not get canvas context'))
      return
    }

    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      const targetHeight = Math.round(targetWidth * (3 / 4)) // 4:3 ratio
      const sourceAspectRatio = img.width / img.height
      const targetAspectRatio = 4 / 3

      let sourceX = 0
      let sourceY = 0
      let sourceWidth = img.width
      let sourceHeight = img.height

      // Crop the image to fit 4:3 ratio
      if (sourceAspectRatio > targetAspectRatio) {
        // Image is wider than 4:3, crop from sides
        sourceWidth = img.height * (4 / 3)
        sourceX = (img.width - sourceWidth) / 2
      } else {
        // Image is taller than 4:3, crop from top/bottom
        sourceHeight = img.width * (3 / 4)
        sourceY = (img.height - sourceHeight) / 2
      }

      // Set canvas dimensions
      canvas.width = targetWidth
      canvas.height = targetHeight

      // Draw and resize the image
      ctx.drawImage(
        img,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        targetWidth,
        targetHeight
      )

      // Clean up object URL
      URL.revokeObjectURL(objectUrl)

      // Convert to blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Failed to create blob from canvas'))
          }
        },
        'image/jpeg',
        0.92 // Quality setting for JPEG (0.92 = 92% quality)
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Failed to load image'))
    }

    // Load the image from file
    img.src = objectUrl
  })
}
