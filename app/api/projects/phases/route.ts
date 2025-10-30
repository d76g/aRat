
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const createPhaseSchema = z.object({
  projectId: z.string().min(1),
  phaseType: z.enum(['material', 'process', 'masterpiece']),
  title: z.string().optional(),
  description: z.string().optional(),
  images: z.array(z.string()).default([]),
  isPublic: z.boolean().default(true)
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

    // Check if user is approved to post content
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isApproved: true, status: true }
    })

    if (!user || !user.isApproved || user.status !== 'APPROVED') {
      return NextResponse.json(
        { 
          message: 'Your account is pending approval. Please wait for admin approval before posting content.',
          status: user?.status || 'PENDING'
        },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = createPhaseSchema.parse(body)

    // Verify the user owns this project and get existing phases
    const project = await prisma.project.findUnique({
      where: { id: validatedData.projectId },
      select: { 
        userId: true, 
        currentPhase: true,
        phases: {
          select: { phaseType: true }
        }
      }
    })

    if (!project) {
      return NextResponse.json(
        { message: 'Project not found' },
        { status: 404 }
      )
    }

    if (project.userId !== session.user.id) {
      return NextResponse.json(
        { message: 'Not authorized to edit this project' },
        { status: 403 }
      )
    }

    // Validate phase ordering: Raw -> Remaking -> Reveal
    const existingPhaseTypes = project.phases.map(p => p.phaseType)
    const requestedPhase = validatedData.phaseType

    if (requestedPhase === 'process') {
      // Must have at least one 'material' (Raw) phase
      if (!existingPhaseTypes.includes('material')) {
        return NextResponse.json(
          { message: 'You must create at least one "Raw" phase before adding a "Remaking" phase' },
          { status: 400 }
        )
      }
    } else if (requestedPhase === 'masterpiece') {
      // Must have both 'material' (Raw) and 'process' (Remaking) phases
      if (!existingPhaseTypes.includes('material')) {
        return NextResponse.json(
          { message: 'You must create at least one "Raw" phase before adding a "Reveal" phase' },
          { status: 400 }
        )
      }
      if (!existingPhaseTypes.includes('process')) {
        return NextResponse.json(
          { message: 'You must create at least one "Remaking" phase before adding a "Reveal" phase' },
          { status: 400 }
        )
      }
    }

    // Create the new phase post
    const newPhase = await prisma.projectPhase.create({
      data: {
        projectId: validatedData.projectId,
        phaseType: validatedData.phaseType,
        title: validatedData.title || null,
        description: validatedData.description || null,
        images: validatedData.images,
        isPublic: validatedData.isPublic
      }
    })

    // Update project's current phase if needed
    const phaseOrder = ['material', 'process', 'masterpiece']
    const currentPhaseIndex = phaseOrder.indexOf(project.currentPhase)
    const newPhaseIndex = phaseOrder.indexOf(validatedData.phaseType)
    
    if (newPhaseIndex > currentPhaseIndex) {
      await prisma.project.update({
        where: { id: validatedData.projectId },
        data: { currentPhase: validatedData.phaseType }
      })
    }

    return NextResponse.json({
      success: true,
      phase: newPhase
    })
  } catch (error) {
    console.error('Error creating phase post:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Invalid data', errors: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { message: 'Failed to create post' },
      { status: 500 }
    )
  }
}
