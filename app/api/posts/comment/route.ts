

import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ 
        error: 'Please sign up to comment on posts', 
        requiresAuth: true,
        redirectTo: '/auth/signup' 
      }, { status: 401 })
    }

    const { postId, content } = await request.json()

    if (!postId || !content?.trim()) {
      return NextResponse.json({ error: 'Post ID and content are required' }, { status: 400 })
    }

    const post = await prisma.projectPhase.findUnique({
      where: { id: postId },
      include: {
        project: { select: { isPublic: true, userId: true } }
      }
    })

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Check if user can comment on this post
    if (!post.project.isPublic && !post.isPublic && post.project.userId !== session.user.id) {
      return NextResponse.json({ error: 'Cannot comment on private post' }, { status: 403 })
    }

    const comment = await prisma.comment.create({
      data: {
        content: content.trim(),
        userId: session.user.id,
        postId: postId
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
        }
      }
    })

    return NextResponse.json({ comment })

  } catch (error) {
    console.error('Error creating comment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

