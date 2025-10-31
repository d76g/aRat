
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/db'

interface RouteParams {
  params: { id: string }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)

    if (!params?.id) {
      return NextResponse.json(
        { message: 'Project ID required' },
        { status: 400 }
      )
    }

    const project = await prisma.project.findUnique({
      where: { id: params.id },
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
        phases: {
          orderBy: {
            createdAt: 'asc'
          }
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                avatar: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        likes: session?.user?.id ? {
          where: {
            userId: session.user.id
          }
        } : false,
        _count: {
          select: {
            likes: true,
            comments: true
          }
        }
      }
    })

    if (!project) {
      return NextResponse.json(
        { message: 'Project not found' },
        { status: 404 }
      )
    }

    // Check if user can view this project
    if (!project.isPublic && project.userId !== session?.user?.id) {
      return NextResponse.json(
        { message: 'Not authorized to view this project' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      project
    })
  } catch (error) {
    console.error('Error fetching project:', error)
    return NextResponse.json(
      { message: 'Failed to fetch project' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      )
    }

    if (!params?.id) {
      return NextResponse.json(
        { message: 'Project ID required' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { isPublic } = body

    // Verify project ownership
    const project = await prisma.project.findUnique({
      where: { id: params.id }
    })

    if (!project) {
      return NextResponse.json(
        { message: 'Project not found' },
        { status: 404 }
      )
    }

    if (project.userId !== session.user.id) {
      return NextResponse.json(
        { message: 'Not authorized to update this project' },
        { status: 403 }
      )
    }

    const updatedProject = await prisma.project.update({
      where: { id: params.id },
      data: {
        isPublic: isPublic !== undefined ? isPublic : project.isPublic,
      }
    })

    return NextResponse.json({
      success: true,
      project: updatedProject
    })
  } catch (error) {
    console.error('Error updating project:', error)
    return NextResponse.json(
      { message: 'Failed to update project' },
      { status: 500 }
    )
  }
}
