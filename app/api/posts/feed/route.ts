

export const dynamic = "force-dynamic";

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
      // For public feeds: Only show posts where BOTH post AND project are public
      // For authenticated users: Show public posts + user's own posts (regardless of privacy)
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
        // Public posts from public projects
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
        // User's own posts (regardless of privacy settings)
        session?.user?.id ? { 
          project: { 
            userId: session.user.id,
            user: {
              status: 'APPROVED' as const,
              isApproved: true
            }
          }
        } : null
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

      // Additional safety filter: Ensure no private posts from other users slip through
      // Helper function to check if a value is true (handles both boolean and 't'/'f' strings)
      const isTrue = (val: any) => val === true || val === 't'
      const isFalse = (val: any) => val === false || val === 'f'
      
      if (isPublic) {
        posts = posts.filter((post: any) => 
          isTrue(post.isPublic) && 
          isTrue(post.project?.isPublic)
        )
      } else if (session?.user?.id) {
        // For authenticated users: filter out posts that are private AND not owned by the user
        posts = posts.filter((post: any) => 
          // Either: post and project are both public
          (isTrue(post.isPublic) && isTrue(post.project?.isPublic)) ||
          // Or: user owns the project
          (post.project?.userId === session.user.id)
        )
      }
    } else if (filter === 'all-posts') {
      // Get all individual posts
      // For public feeds: Only show posts where BOTH post AND project are public
      // For authenticated users: Show public posts + user's own posts (regardless of privacy)
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
        // Public posts from public projects
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
        // User's own posts (regardless of privacy settings)
        session?.user?.id ? { 
          project: { 
            userId: session.user.id,
            user: {
              status: 'APPROVED' as const,
              isApproved: true
            }
          }
        } : null
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

      // Additional safety filter: Ensure no private posts from other users slip through
      // Helper function to check if a value is true (handles both boolean and 't'/'f' strings)
      const isTrue = (val: any) => val === true || val === 't'
      const isFalse = (val: any) => val === false || val === 'f'
      
      if (isPublic) {
        posts = posts.filter((post: any) => 
          isTrue(post.isPublic) && 
          isTrue(post.project?.isPublic)
        )
      } else if (session?.user?.id) {
        // For authenticated users: filter out posts that are private AND not owned by the user
        posts = posts.filter((post: any) => 
          // Either: post and project are both public
          (isTrue(post.isPublic) && isTrue(post.project?.isPublic)) ||
          // Or: user owns the project
          (post.project?.userId === session.user.id)
        )
      }
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

