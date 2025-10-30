
import { downloadFile } from './s3'

// Cache for signed URLs to avoid regenerating them frequently
const signedUrlCache = new Map<string, { url: string, expires: number }>()

export async function getSignedImageUrl(s3Key: string): Promise<string> {
  if (!s3Key) {
    console.warn('getSignedImageUrl called with empty s3Key')
    return ''
  }
  
  // If it's already a full URL (legacy data or already signed), return as is
  if (s3Key.startsWith('http')) {
    return s3Key
  }
  
  // Check cache first (valid for 12 hours, URLs are valid for 24 hours)
  const cached = signedUrlCache.get(s3Key)
  if (cached && Date.now() < cached.expires) {
    console.log(`Using cached signed URL for: ${s3Key}`)
    return cached.url
  }
  
  try {
    console.log(`Generating signed URL for: ${s3Key}`)
    const signedUrl = await downloadFile(s3Key)
    
    if (!signedUrl) {
      throw new Error('Failed to generate signed URL')
    }
    
    // Cache for 12 hours (signed URLs are valid for 24 hours)
    signedUrlCache.set(s3Key, {
      url: signedUrl,
      expires: Date.now() + (12 * 60 * 60 * 1000)
    })
    
    console.log(`Generated signed URL successfully for: ${s3Key}`)
    return signedUrl
  } catch (error) {
    console.error('Error generating signed URL for key:', s3Key, error)
    
    // Clear cache entry if it exists
    signedUrlCache.delete(s3Key)
    
    throw error
  }
}

export async function getSignedImageUrls(s3Keys: string[]): Promise<string[]> {
  if (!s3Keys || s3Keys.length === 0) return []
  
  // Process in parallel but handle errors individually
  const results = await Promise.allSettled(
    s3Keys.map(key => getSignedImageUrl(key))
  )
  
  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value
    } else {
      console.error(`Failed to get signed URL for key ${s3Keys[index]}:`, result.reason)
      return '' // Return empty string for failed URLs
    }
  })
}

// Helper function to clear cache
export function clearImageUrlCache() {
  signedUrlCache.clear()
}

// Helper function to clear specific cache entry
export function clearImageUrlCacheForKey(key: string) {
  signedUrlCache.delete(key)
}
