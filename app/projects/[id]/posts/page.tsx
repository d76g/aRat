

import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/db'
import { ProjectPostsFeed } from '@/components/project-posts-feed'

export const dynamic = "force-dynamic"

interface ProjectPostsPageProps {
  params: { id: string }
}

export default async function ProjectPostsPage({ params }: ProjectPostsPageProps) {
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

    return (
      <ProjectPostsFeed 
        project={project} 
        currentUserId={session?.user?.id} 
      />
    )
  } catch (error) {
    console.error('Error fetching project posts:', error)
    notFound()
  }
}

