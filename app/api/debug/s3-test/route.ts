
import { NextRequest, NextResponse } from 'next/server'
import { downloadFile } from '@/lib/s3'
import { getBucketConfig } from '@/lib/aws-config'

export async function GET(request: NextRequest) {
  try {
    const bucketConfig = getBucketConfig()
    
    // Test with a dummy S3 key
    const testKey = 'uploads/test-image.jpg'
    
    console.log('Testing S3 configuration...')
    console.log('Bucket Name:', bucketConfig.bucketName)
    console.log('Folder Prefix:', bucketConfig.folderPrefix)
    console.log('Test Key:', testKey)
    
    try {
      const signedUrl = await downloadFile(testKey)
      console.log('Generated signed URL:', signedUrl)
      
      return NextResponse.json({
        success: true,
        bucketName: bucketConfig.bucketName,
        folderPrefix: bucketConfig.folderPrefix,
        testKey,
        signedUrl: signedUrl.substring(0, 100) + '...',
        message: 'S3 configuration appears to be working'
      })
    } catch (s3Error: any) {
      console.error('S3 Error:', s3Error)
      return NextResponse.json({
        success: false,
        error: 'S3 configuration issue',
        details: s3Error?.message || 'Unknown S3 error',
        bucketName: bucketConfig.bucketName
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
