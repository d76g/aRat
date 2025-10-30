
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const adminUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true }
    })

    if (!adminUser?.isAdmin) {
      return NextResponse.json({ message: 'Admin access required' }, { status: 403 })
    }

    const { username, approve } = await request.json()

    if (!username) {
      return NextResponse.json({ message: 'Username is required' }, { status: 400 })
    }

    // Search for user with similar username
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: username, mode: 'insensitive' } },
          { email: { contains: username, mode: 'insensitive' } },
          { firstName: { contains: username, mode: 'insensitive' } },
          { lastName: { contains: username, mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        status: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    })

    // If approve flag is true and exactly one user found, approve them
    if (approve && users.length === 1) {
      const userToApprove = users[0]
      
      const updatedUser = await prisma.user.update({
        where: { id: userToApprove.id },
        data: { 
          status: 'APPROVED',
          isApproved: true
        }
      })

      // Log moderation action
      await prisma.moderationAction.create({
        data: {
          type: 'APPROVE',
          entityType: 'user',
          entityId: userToApprove.id,
          reason: `Auto-approved by admin search for "${username}"`,
          adminId: session.user.id
        }
      })

      return NextResponse.json({
        success: true,
        message: `User ${userToApprove.username} has been approved`,
        user: updatedUser
      })
    }

    return NextResponse.json({
      success: true,
      users: users,
      message: `Found ${users.length} user(s) matching "${username}"`
    })

  } catch (error) {
    console.error('Find user error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
