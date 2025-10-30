
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ 
        message: 'Please sign in to create projects. New users need to fill out the "Become a Remaker" form first.',
        requiresAuth: true,
        redirectTo: '/auth/become-remaker'
      }, { status: 401 })
    }

    // Check if user is approved to create projects
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isApproved: true, status: true }
    })

    if (!user || !user.isApproved || user.status !== 'APPROVED') {
      return NextResponse.json(
        { 
          message: 'Your account is pending approval. Please wait for admin approval before creating projects.',
          status: user?.status || 'PENDING',
          requiresApproval: true
        },
        { status: 403 }
      )
    }

    const { title, description, isPublic } = await request.json()

    if (!title) {
      return NextResponse.json({ message: 'Title is required' }, { status: 400 })
    }

    const project = await prisma.project.create({
      data: {
        title,
        description,
        isPublic: isPublic ?? true,
        userId: session.user.id,
        currentPhase: 'material'
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        },
        phases: true,
        _count: {
          select: {
            likes: true,
            comments: true
          }
        }
      }
    })

    return NextResponse.json({ project })
  } catch (error) {
    console.error('Create project error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
