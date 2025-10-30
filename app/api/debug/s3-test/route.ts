
import { NextRequest, NextResponse } from 'next/server'
import { getFileUrl, fileExists } from '@/lib/local-storage'

export async function GET(request: NextRequest) {
  try {
    const uploadDir = process.env.UPLOAD_DIR || '/var/www/prieelo/uploads'
    const baseUrl = process.env.BASE_URL || 'https://prieelo.com'
    
    // Test with a dummy local path
    const testPath = '2024/10/test-image.jpg'
    
    console.log('Testing local storage configuration...')
    console.log('Upload Directory:', uploadDir)
    console.log('Base URL:', baseUrl)
    console.log('Test Path:', testPath)
    
    try {
      const publicUrl = await getFileUrl(testPath)
      const exists = await fileExists(testPath)
      
      console.log('Generated public URL:', publicUrl)
      console.log('File exists:', exists)
      
      return NextResponse.json({
        success: true,
        uploadDir,
        baseUrl,
        testPath,
        publicUrl,
        fileExists: exists,
        message: 'Local storage configuration appears to be working'
      })
    } catch (storageError: any) {
      console.error('Storage Error:', storageError)
      return NextResponse.json({
        success: false,
        error: 'Local storage configuration issue',
        details: storageError?.message || 'Unknown storage error',
        uploadDir
      }, { status: 500 })
    }
  } catch (error: any) {
    console.error('Debug error:', error)
    return NextResponse.json({
      success: false,
      error: 'Configuration error',
      details: error?.message || 'Unknown error'
    }, { status: 500 })
  }
}
