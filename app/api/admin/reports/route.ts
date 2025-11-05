
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true }
    })

    if (!user || !user.isAdmin) {
      return NextResponse.json(
        { message: 'Forbidden' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'all'

    // Build where clause
    const where: any = {}
    if (status !== 'all') {
      where.status = status
    }

    // Fetch reports with related data
    const reports = await prisma.report.findMany({
      where,
      include: {
        reporter: {
          select: {
            id: true,
            username: true,
            email: true,
            firstName: true,
            lastName: true
          }
        },
        reviewer: {
          select: {
            id: true,
            username: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Fetch the actual content (post or comment) for each report
    const reportsWithContent = await Promise.all(
      reports.map(async (report) => {
        let content = null
        let contentAuthor = null

        if (report.entityType === 'post') {
          const post = await prisma.projectPhase.findUnique({
            where: { id: report.entityId },
            include: {
              project: {
                include: {
                  user: {
                    select: {
                      id: true,
                      username: true,
                      email: true,
                      firstName: true,
                      lastName: true
                    }
                  }
                }
              }
            }
          })
          if (post) {
            content = {
              id: post.id,
              title: post.title,
              description: post.description,
              images: post.images,
              phaseType: post.phaseType,
              createdAt: post.createdAt,
              project: {
                id: post.project.id,
                title: post.project.title
              }
            }
            contentAuthor = post.project.user
          }
        } else if (report.entityType === 'comment') {
          const comment = await prisma.comment.findUnique({
            where: { id: report.entityId },
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  email: true,
                  firstName: true,
                  lastName: true
                }
              },
              project: {
                select: {
                  id: true,
                  title: true
                }
              },
              post: {
                select: {
                  id: true,
                  title: true
                }
              }
            }
          })
          if (comment) {
            content = {
              id: comment.id,
              content: comment.content,
              createdAt: comment.createdAt,
              project: comment.project,
              post: comment.post
            }
            contentAuthor = comment.user
          }
        }

        return {
          ...report,
          content,
          contentAuthor
        }
      })
    )

    return NextResponse.json({
      success: true,
      reports: reportsWithContent
    })
  } catch (error) {
    console.error('Error fetching reports:', error)
    return NextResponse.json(
      { message: 'Failed to fetch reports' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true }
    })

    if (!user || !user.isAdmin) {
      return NextResponse.json(
        { message: 'Forbidden' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { reportId, status } = body

    if (!reportId || !status) {
      return NextResponse.json(
        { message: 'Report ID and status are required' },
        { status: 400 }
      )
    }

    const updateData: any = {
      status,
      reviewedAt: new Date(),
      reviewedBy: session.user.id
    }

    const report = await prisma.report.update({
      where: { id: reportId },
      data: updateData,
      include: {
        reporter: {
          select: {
            id: true,
            username: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      report
    })
  } catch (error) {
    console.error('Error updating report:', error)
    return NextResponse.json(
      { message: 'Failed to update report' },
      { status: 500 }
    )
  }
}

