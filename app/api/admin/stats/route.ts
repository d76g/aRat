

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
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

    // Get various statistics
    const [
      totalUsers,
      pendingUsers,
      approvedUsers,
      suspendedUsers,
      totalProjects,
      totalPosts,
      totalComments,
      recentUsers,
      recentProjects
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: 'PENDING' } }),
      prisma.user.count({ where: { status: 'APPROVED' } }),
      prisma.user.count({ where: { status: 'SUSPENDED' } }),
      prisma.project.count(),
      prisma.projectPhase.count(),
      prisma.comment.count(),
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        }
      }),
      prisma.project.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        }
      })
    ])

    return NextResponse.json({
      stats: {
        users: {
          total: totalUsers,
          pending: pendingUsers,
          approved: approvedUsers,
          suspended: suspendedUsers,
          recent: recentUsers
        },
        content: {
          projects: totalProjects,
          posts: totalPosts,
          comments: totalComments,
          recentProjects: recentProjects
        }
      }
    })
  } catch (error) {
    console.error('Admin stats fetch error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

