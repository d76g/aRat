

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/db'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { status, reason } = await request.json()

    if (!['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'].includes(status)) {
      return NextResponse.json({ message: 'Invalid status' }, { status: 400 })
    }

    // Update user status
    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: { 
        status: status,
        isApproved: status === 'APPROVED'
      }
    })

    // Log moderation action
    await prisma.moderationAction.create({
      data: {
        type: status === 'APPROVED' ? 'APPROVE' : 
              status === 'REJECTED' ? 'REJECT' : 'SUSPEND',
        entityType: 'user',
        entityId: params.id,
        reason: reason || null,
        adminId: session.user.id
      }
    })

    return NextResponse.json({
      success: true,
      user: updatedUser
    })
  } catch (error) {
    console.error('Admin user status update error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

