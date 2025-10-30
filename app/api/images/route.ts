
import { NextRequest, NextResponse } from 'next/server'
import { getLocalImageUrls } from '@/lib/image-utils'

export async function POST(request: NextRequest) {
  try {
    const { s3Keys: imagePaths } = await request.json()
    
    if (!imagePaths || !Array.isArray(imagePaths)) {
      return NextResponse.json(
        { message: 'Invalid image paths provided' },
        { status: 400 }
      )
    }

    const publicUrls = await getLocalImageUrls(imagePaths)
    
    return NextResponse.json({
      success: true,
      urls: publicUrls
    })
  } catch (error) {
    console.error('Error generating public URLs:', error)
    return NextResponse.json(
      { message: 'Failed to generate public URLs' },
      { status: 500 }
    )
  }
}
