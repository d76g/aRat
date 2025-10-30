
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
        message: 'Please sign up to like projects',
        requiresAuth: true,
        redirectTo: '/auth/signup'
      }, { status: 401 })
    }

    const { projectId } = await request.json()

    if (!projectId) {
      return NextResponse.json({ message: 'Project ID is required' }, { status: 400 })
    }

    // Check if user already liked this project
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_projectId: {
          userId: session.user.id,
          projectId
        }
      }
    })

    if (existingLike) {
      // Unlike
      await prisma.like.delete({
        where: {
          id: existingLike.id
        }
      })
      return NextResponse.json({ liked: false })
    } else {
      // Like
      await prisma.like.create({
        data: {
          userId: session.user.id,
          projectId
        }
      })
      return NextResponse.json({ liked: true })
    }
  } catch (error) {
    console.error('Like error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
