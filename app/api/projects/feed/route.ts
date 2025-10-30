
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Allow public access to feed - authentication not required to view public content

    const url = new URL(request.url)
    const filter = url.searchParams.get('filter') || 'all'

    let posts

    if (filter === 'all-projects') {
      // For all projects, get the latest post from each public project
      const projects = await prisma.project.findMany({
        where: {
          isPublic: true,
          user: {
            status: 'APPROVED' as const,
            isApproved: true
          }
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
          _count: {
            select: {
              likes: true,
              comments: true
            }
          },
          likes: session?.user?.id ? {
            where: {
              userId: session.user.id
            }
          } : false,
          phases: {
            orderBy: {
              updatedAt: 'desc'
            },
            take: 1
          }
        },
        orderBy: {
          updatedAt: 'desc'
        },
        take: 50
      })

      // Transform to match the expected format
      posts = projects
        .filter(project => project.phases.length > 0)
        .map(project => ({
          ...project.phases[0],
          project: {
            id: project.id,
            title: project.title,
            description: project.description,
            userId: project.userId,
            user: project.user,
            _count: project._count,
            likes: project.likes
          }
        }))
    } else {
      // For specific phase filters or all posts
      const whereCondition: any = {
        project: {
          isPublic: true,
          user: {
            status: 'APPROVED' as const,
            isApproved: true
          }
        }
      }

      if (filter !== 'all' && filter !== 'all-projects') {
        whereCondition.phaseType = filter
      }

      posts = await prisma.projectPhase.findMany({
        where: whereCondition,
        orderBy: {
          updatedAt: 'desc'
        },
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
              },
              _count: {
                select: {
                  likes: true,
                  comments: true
                }
              },
              likes: session?.user?.id ? {
                where: {
                  userId: session.user.id
                }
              } : false
            }
          }
        },
        take: 50
      })
    }

    return NextResponse.json({ posts })
  } catch (error) {
    console.error('Feed error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
