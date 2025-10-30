

import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ 
        error: 'Please sign up to like posts', 
        requiresAuth: true,
        redirectTo: '/auth/signup' 
      }, { status: 401 })
    }

    const { postId } = await request.json()

    if (!postId) {
      return NextResponse.json({ error: 'Post ID is required' }, { status: 400 })
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

    // Check if user can like this post
    if (!post.project.isPublic && !post.isPublic && post.project.userId !== session.user.id) {
      return NextResponse.json({ error: 'Cannot like private post' }, { status: 403 })
    }

    // Check if already liked
    const existingLike = await prisma.postLike.findUnique({
      where: {
        userId_postId: {
          userId: session.user.id,
          postId: postId
        }
      }
    })

    if (existingLike) {
      // Unlike
      await prisma.postLike.delete({
        where: { id: existingLike.id }
      })
    } else {
      // Like
      await prisma.postLike.create({
        data: {
          userId: session.user.id,
          postId: postId
        }
      })
    }

    const likeCount = await prisma.postLike.count({
      where: { postId }
    })

    return NextResponse.json({ 
      liked: !existingLike,
      likeCount
    })

  } catch (error) {
    console.error('Error toggling like:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

