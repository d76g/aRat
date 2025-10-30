
import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/db'
import { ProjectDetail } from '@/components/project-detail'

export const dynamic = "force-dynamic"

interface ProjectPageProps {
  params: { id: string }
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const session = await getServerSession(authOptions)
  
  if (!params?.id) {
    notFound()
  }

  try {
    const project = await prisma.project.findUnique({
      where: { id: params.id },
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
          orderBy: {
            createdAt: 'asc'
          }
        },
        comments: {
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
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        likes: session?.user?.id ? {
          where: {
            userId: session.user.id
          }
        } : false,
        _count: {
          select: {
            likes: true,
            comments: true
          }
        }
      }
    })

    if (!project) {
      notFound()
    }

    // Check if user can view this project
    if (!project.isPublic && project.userId !== session?.user?.id) {
      notFound()
    }

    return <ProjectDetail project={project as any} currentUserId={session?.user?.id} />
  } catch (error) {
    console.error('Error fetching project:', error)
    notFound()
  }
}
