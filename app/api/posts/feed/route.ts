

import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const { searchParams } = new URL(request.url)
    const filter = searchParams.get('filter') || 'all-posts'
    const projectId = searchParams.get('projectId')
    const isPublic = searchParams.get('public') === 'true'

    let posts = []

    if (projectId) {
      // Get posts from a specific project
      const whereConditions = isPublic ? [
        { 
          isPublic: true, 
          project: { 
            user: {
              status: 'APPROVED' as const,
              isApproved: true
            }
          }
        },
        { 
          project: { 
            isPublic: true,
            user: {
              status: 'APPROVED' as const, 
              isApproved: true
            }
          }
        }
      ] : [
        { 
          isPublic: true, 
          project: { 
            user: {
              status: 'APPROVED' as const,
              isApproved: true
            }
          }
        },
        { 
          project: { 
            isPublic: true,
            user: {
              status: 'APPROVED' as const, 
              isApproved: true
            }
          }
        },
        session?.user?.id ? { project: { userId: session.user.id } } : null
      ].filter(Boolean) as any

      posts = await prisma.projectPhase.findMany({
        where: {
          projectId,
          OR: whereConditions
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
        },
        orderBy: {
          createdAt: 'desc'
        }
      })
    } else if (filter === 'all-posts') {
      // Get all individual posts
      const whereConditions = isPublic ? [
        { 
          isPublic: true, 
          project: { 
            isPublic: true,
            user: {
              status: 'APPROVED' as const,
              isApproved: true
            }
          }
        }
      ] : [
        { 
          isPublic: true, 
          project: { 
            isPublic: true,
            user: {
              status: 'APPROVED' as const,
              isApproved: true
            }
          }
        },
        session?.user?.id ? { project: { userId: session.user.id } } : null
      ].filter(Boolean) as any

      posts = await prisma.projectPhase.findMany({
        where: {
          OR: whereConditions
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
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 50
      })
    } else {
      // Get projects with latest post from each
      const projects = await prisma.project.findMany({
        where: {
          isPublic: true, // Always show only public projects for public feed
          user: {
            status: 'APPROVED' as const,
            isApproved: true
          },
          phases: {
            some: {
              isPublic: true,
              ...(filter !== 'all-projects' ? { phaseType: filter } : {})
            }
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
          phases: {
            where: {
              isPublic: true,
              ...(filter !== 'all-projects' ? { phaseType: filter } : {})
            },
            orderBy: {
              updatedAt: 'desc'
            },
            take: 1,
            include: {
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
        },
        orderBy: {
          updatedAt: 'desc'
        },
        take: 50
      })

      // Transform projects into post format for consistency
      posts = projects.map(project => {
        const latestPost = project.phases[0]
        return latestPost ? {
          ...latestPost,
          project: {
            ...project,
            phases: undefined // Remove to avoid circular reference
          }
        } : null
      }).filter(Boolean)
    }

    return NextResponse.json({ posts })

  } catch (error) {
    console.error('Error fetching posts feed:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

