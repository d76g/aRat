

import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ProjectCard } from '@/components/project-card'
import { CalendarDays, MapPin, Link as LinkIcon, Settings } from 'lucide-react'
import Link from 'next/link'

export const dynamic = "force-dynamic"

interface ProfilePageProps {
  params: { username: string }
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const session = await getServerSession(authOptions)
  
  if (!params?.username) {
    notFound()
  }

  try {
    // Find user by username
    const user = await prisma.user.findUnique({
      where: { username: params.username },
      include: {
        projects: {
          where: {
            OR: [
              { isPublic: true },
              { userId: session?.user?.id || '' }
            ]
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
              orderBy: {
                createdAt: 'asc'
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
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        _count: {
          select: {
            projects: true
          }
        }
      }
    })

    if (!user) {
      notFound()
    }

    const isOwnProfile = session?.user?.id === user.id

    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="space-y-6">
          {/* Profile Header */}
          <Card>
            <CardHeader>
              <div className="flex items-start space-x-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={user.avatar || ''} />
                  <AvatarFallback className="text-2xl">
                    {user.username?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h1 className="text-2xl font-bold">@{user.username}</h1>
                    {isOwnProfile && (
                      <>
                        <Badge variant="secondary">My Profile</Badge>
                        <Link href={`/profile/${user.username}/settings`}>
                          <Button variant="outline" size="sm">
                            <Settings className="h-4 w-4 mr-2" />
                            Settings
                          </Button>
                        </Link>
                      </>
                    )}
                  </div>
                  
                  {(user.firstName || user.lastName) && (
                    <p className="text-lg text-muted-foreground mb-2">
                      {user.firstName} {user.lastName}
                    </p>
                  )}
                  
                  {user.bio && (
                    <p className="text-muted-foreground mb-4">{user.bio}</p>
                  )}
                  
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <CalendarDays className="h-4 w-4" />
                      <span>Joined {new Date(user.createdAt).toLocaleDateString('en-US', { 
                        month: 'long', 
                        year: 'numeric' 
                      })}</span>
                    </div>
                    <div>
                      <span className="font-medium text-foreground">{user._count.projects}</span> projects
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Projects Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                {isOwnProfile ? 'My Projects' : `${user.firstName || user.username}'s Projects`}
              </h2>
              {user.projects.length > 0 && (
                <Badge variant="outline">
                  {user.projects.length} {user.projects.length === 1 ? 'project' : 'projects'}
                </Badge>
              )}
            </div>

            {user.projects.length > 0 ? (
              <div className="grid gap-6">
                {user.projects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project as any}
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                    <div className="h-6 w-6 text-muted-foreground">📦</div>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
                  <p className="text-muted-foreground">
                    {isOwnProfile 
                      ? "Start your first transformation project!" 
                      : `${user.firstName || user.username} hasn't shared any projects yet.`
                    }
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error('Error fetching profile:', error)
    notFound()
  }
}
