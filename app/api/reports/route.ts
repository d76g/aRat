
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const reportSchema = z.object({
  entityType: z.enum(['post', 'comment']),
  entityId: z.string().min(1),
  reason: z.string().min(1),
  description: z.string().optional()
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = reportSchema.parse(body)

    // Verify the entity exists
    if (validatedData.entityType === 'post') {
      const post = await prisma.projectPhase.findUnique({
        where: { id: validatedData.entityId }
      })
      if (!post) {
        return NextResponse.json(
          { message: 'Post not found' },
          { status: 404 }
        )
      }
    } else if (validatedData.entityType === 'comment') {
      const comment = await prisma.comment.findUnique({
        where: { id: validatedData.entityId }
      })
      if (!comment) {
        return NextResponse.json(
          { message: 'Comment not found' },
          { status: 404 }
        )
      }
    }

    // Check if user already reported this entity
    const existingReport = await prisma.report.findFirst({
      where: {
        entityType: validatedData.entityType,
        entityId: validatedData.entityId,
        reporterId: session.user.id,
        status: 'PENDING'
      }
    })

    if (existingReport) {
      return NextResponse.json(
        { message: 'You have already reported this content' },
        { status: 400 }
      )
    }

    // Create the report
    const report = await prisma.report.create({
      data: {
        entityType: validatedData.entityType,
        entityId: validatedData.entityId,
        reason: validatedData.reason,
        description: validatedData.description || null,
        reporterId: session.user.id,
        status: 'PENDING'
      },
      include: {
        reporter: {
          select: {
            id: true,
            username: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Report submitted successfully. We will review it shortly.',
      report
    })
  } catch (error) {
    console.error('Error creating report:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Invalid data', errors: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { message: 'Failed to submit report' },
      { status: 500 }
    )
  }
}

