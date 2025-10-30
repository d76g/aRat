
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { uploadFile, getFileUrl } from '@/lib/local-storage'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { 
          message: 'Please sign in to upload files. New users need to fill out the "Become a Remaker" form first.',
          requiresAuth: true,
          redirectTo: '/auth/become-remaker'
        },
        { status: 401 }
      )
    }

    // Check if user is approved to upload content
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isApproved: true, status: true }
    })

    if (!user || !user.isApproved || user.status !== 'APPROVED') {
      return NextResponse.json(
        { 
          message: 'Your account is pending approval. Please wait for admin approval before uploading content.',
          status: user?.status || 'PENDING',
          requiresApproval: true
        },
        { status: 403 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { message: 'No file provided' },
        { status: 400 }
      )
    }

    // Check file size (15MB limit to prevent memory issues)
    const maxSize = 15 * 1024 * 1024 // 15MB in bytes
    if (file.size > maxSize) {
      return NextResponse.json(
        { message: `File size exceeds 15MB limit. Please compress your image and try again. Current size: ${(file.size / (1024 * 1024)).toFixed(2)}MB` },
        { status: 400 }
      )
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { message: 'Invalid file type. Please upload an image' },
        { status: 400 }
      )
    }

    // Convert file to buffer for local upload
    const buffer = Buffer.from(await file.arrayBuffer())
    const fileName = file.name
    const contentType = file.type
    
    // Generate unique filename
    const timestamp = Date.now()
    const uniqueFileName = `${timestamp}-${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    
    console.log(`Uploading file: ${uniqueFileName}, type: ${contentType}, size: ${buffer.length} bytes`)
    
    // Upload to local storage with content type
    const cloud_storage_path = await uploadFile(buffer, uniqueFileName, contentType)
    
    console.log(`File uploaded locally with path: ${cloud_storage_path}`)
    
    // Generate public URL for immediate access
    const publicUrl = await getFileUrl(cloud_storage_path)
    
    console.log(`Generated public URL for immediate preview: ${publicUrl}`)
    
    return NextResponse.json({
      success: true,
      url: publicUrl, // This is for immediate preview
      cloud_storage_path: cloud_storage_path, // This should be stored in DB
      message: 'File uploaded successfully'
    })
  } catch (error: any) {
    console.error('Upload error:', error)
    
    // Provide more detailed error messages
    let errorMessage = 'Failed to upload file'
    if (error?.message?.includes('ENOSPC')) {
      errorMessage = 'Server storage full. Please contact support.'
    } else if (error?.message?.includes('EACCES')) {
      errorMessage = 'Server permission error. Please contact support.'
    } else if (error?.message?.includes('EMFILE') || error?.message?.includes('ENFILE')) {
      errorMessage = 'Server resource limit reached. Please try again later.'
    } else if (error?.message) {
      errorMessage = `Upload failed: ${error.message}`
    }
    
    return NextResponse.json(
      { 
        message: errorMessage,
        error: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    )
  }
}
