
import { NextRequest, NextResponse } from 'next/server'
import { getSignedImageUrls } from '@/lib/image-utils'

export async function POST(request: NextRequest) {
  try {
    const { s3Keys } = await request.json()
    
    if (!s3Keys || !Array.isArray(s3Keys)) {
      return NextResponse.json(
        { message: 'Invalid s3Keys provided' },
        { status: 400 }
      )
    }

    const signedUrls = await getSignedImageUrls(s3Keys)
    
    return NextResponse.json({
      success: true,
      urls: signedUrls
    })
  } catch (error) {
    console.error('Error generating signed URLs:', error)
    return NextResponse.json(
      { message: 'Failed to generate signed URLs' },
      { status: 500 }
    )
  }
}
