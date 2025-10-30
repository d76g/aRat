
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getFileUrl, fileExists } from '@/lib/local-storage'

export async function GET(request: NextRequest) {
  try {
    // Get a sample of project phases with images
    const phases = await prisma.projectPhase.findMany({
      take: 5,
      where: {
        images: {
          isEmpty: false
        }
      },
      select: {
        id: true,
        images: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const uploadDir = process.env.UPLOAD_DIR || '/var/www/prieelo/uploads'
    const baseUrl = process.env.BASE_URL || 'https://prieelo.com'
    
    // Test each image path
    const results = []
    for (const phase of phases) {
      for (const imagePath of phase.images) {
        try {
          console.log(`Testing image path: ${imagePath}`)
          
          // Check if file exists and generate public URL
          const exists = await fileExists(imagePath)
          const publicUrl = await getFileUrl(imagePath)
          
          results.push({
            phaseId: phase.id,
            originalPath: imagePath,
            publicUrl,
            fileExists: exists,
            status: exists ? 'success' : 'file_missing'
          })
        } catch (error: any) {
          console.error(`Failed to process path: ${imagePath}`, error)
          
          results.push({
            phaseId: phase.id,
            originalPath: imagePath,
            error: error?.message || 'Unknown error',
            status: 'failed'
          })
        }
      }
    }

    return NextResponse.json({
      success: true,
      storageConfig: {
        uploadDir,
        baseUrl
      },
      totalPhases: phases.length,
      results
    })
  } catch (error: any) {
    console.error('Debug error:', error)
    return NextResponse.json({
      success: false,
      error: error?.message || 'Unknown error'
    }, { status: 500 })
  }
}
