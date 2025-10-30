
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
