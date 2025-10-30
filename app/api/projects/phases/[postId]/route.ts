
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/db'
import { z } from 'zod'

interface RouteParams {
  params: { postId: string }
}

const updatePhaseSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  images: z.array(z.string()).default([]),
  isPublic: z.boolean().optional()
})

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)

    if (!params?.postId) {
      return NextResponse.json(
        { message: 'Post ID required' },
        { status: 400 }
      )
    }

    const post = await prisma.projectPhase.findUnique({
      where: { id: params.postId },
      include: {
        project: {
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
          }
        }
      }
    })

    if (!post) {
      return NextResponse.json(
        { message: 'Post not found' },
        { status: 404 }
      )
    }

    // Check if user can access this post
    const canAccess = post.isPublic || 
                     post.project.isPublic || 
                     (session?.user?.id && post.project.userId === session.user.id)

    if (!canAccess) {
      return NextResponse.json(
        { message: 'Forbidden' },
        { status: 403 }
      )
    }

    return NextResponse.json({ post })
  } catch (error) {
    console.error('Error fetching post:', error)
    return NextResponse.json(
      { message: 'Failed to fetch post' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!params?.postId) {
      return NextResponse.json(
        { message: 'Post ID required' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const validatedData = updatePhaseSchema.parse(body)

    // Verify the user owns this post
    const post = await prisma.projectPhase.findUnique({
      where: { id: params.postId },
      include: {
        project: {
          select: { userId: true }
        }
      }
    })

    if (!post) {
      return NextResponse.json(
        { message: 'Post not found' },
        { status: 404 }
      )
    }

    if (post.project.userId !== session.user.id) {
      return NextResponse.json(
        { message: 'Not authorized to edit this post' },
        { status: 403 }
      )
    }

    // Update the post
    const updateData: any = {
      title: validatedData.title || null,
      description: validatedData.description || null,
      images: validatedData.images
    }

    // Only update isPublic if it was provided
    if (validatedData.isPublic !== undefined) {
      updateData.isPublic = validatedData.isPublic
    }

    const updatedPost = await prisma.projectPhase.update({
      where: { id: params.postId },
      data: updateData
    })

    return NextResponse.json({
      success: true,
      post: updatedPost
    })
  } catch (error) {
    console.error('Error updating post:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Invalid data', errors: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { message: 'Failed to update post' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!params?.postId) {
      return NextResponse.json(
        { message: 'Post ID required' },
        { status: 400 }
      )
    }

    // Verify the user owns this post
    const post = await prisma.projectPhase.findUnique({
      where: { id: params.postId },
      include: {
        project: {
          select: { userId: true }
        }
      }
    })

    if (!post) {
      return NextResponse.json(
        { message: 'Post not found' },
        { status: 404 }
      )
    }

    if (post.project.userId !== session.user.id) {
      return NextResponse.json(
        { message: 'Not authorized to delete this post' },
        { status: 403 }
      )
    }

    // Delete the post
    await prisma.projectPhase.delete({
      where: { id: params.postId }
    })

    return NextResponse.json({
      success: true,
      message: 'Post deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting post:', error)
    return NextResponse.json(
      { message: 'Failed to delete post' },
      { status: 500 }
    )
  }
}
