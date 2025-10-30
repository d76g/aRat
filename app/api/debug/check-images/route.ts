
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { downloadFile } from '@/lib/s3'
import { getBucketConfig } from '@/lib/aws-config'

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

    const bucketConfig = getBucketConfig()
    
    // Test each image key
    const results = []
    for (const phase of phases) {
      for (const imageKey of phase.images) {
        try {
          console.log(`Testing image key: ${imageKey}`)
          
          // Try to generate signed URL
          const signedUrl = await downloadFile(imageKey)
          
          results.push({
            phaseId: phase.id,
            originalKey: imageKey,
            signedUrlPreview: signedUrl.substring(0, 150) + '...',
            status: 'success'
          })
        } catch (error: any) {
          console.error(`Failed to generate URL for key: ${imageKey}`, error)
          
          // Try with folder prefix if not already included
          try {
            const keyWithPrefix = imageKey.startsWith(bucketConfig.folderPrefix) 
              ? imageKey 
              : `${bucketConfig.folderPrefix}${imageKey}`
            
            console.log(`Retrying with key: ${keyWithPrefix}`)
            const signedUrl = await downloadFile(keyWithPrefix)
            
            results.push({
              phaseId: phase.id,
              originalKey: imageKey,
              correctedKey: keyWithPrefix,
              signedUrlPreview: signedUrl.substring(0, 150) + '...',
              status: 'success_with_correction'
            })
          } catch (retryError: any) {
            results.push({
              phaseId: phase.id,
              originalKey: imageKey,
              error: retryError?.message || 'Unknown error',
              status: 'failed'
            })
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      bucketConfig: {
        bucketName: bucketConfig.bucketName,
        folderPrefix: bucketConfig.folderPrefix
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
