
'use client'

import { useState } from 'react'
import { Project } from '@/lib/types'
import { PostCard } from '@/components/post-card'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Heart, MessageCircle, Share2, ArrowLeft, Lock, Globe, Settings } from 'lucide-react'
import { PHASE_LABELS } from '@/lib/types'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'

interface ProjectDetailProps {
  project: Project
  currentUserId?: string
}

export function ProjectDetail({ project, currentUserId }: ProjectDetailProps) {
  const [isLiked, setIsLiked] = useState(
    project?.likes?.some(like => like?.userId === currentUserId) ?? false
  )
  const [likeCount, setLikeCount] = useState(project?._count?.likes ?? 0)
  const [isLiking, setIsLiking] = useState(false)
  const [isPublic, setIsPublic] = useState(project?.isPublic ?? true)
  const [isUpdatingPrivacy, setIsUpdatingPrivacy] = useState(false)
  const router = useRouter()

  const isOwner = project?.userId === currentUserId
  const phases = ['material', 'process', 'masterpiece'] as const
  
  // Check existing phases to determine what can be added
  const existingPhases = project?.phases?.map(p => p.phaseType) || []
  const hasRawPhase = existingPhases.includes('material')
  const hasRemakingPhase = existingPhases.includes('process')
  
  const canAddPhase = (phaseType: string) => {
    if (phaseType === 'material') return true // Can always add Raw
    if (phaseType === 'process') return hasRawPhase // Need Raw first
    if (phaseType === 'masterpiece') return hasRawPhase && hasRemakingPhase // Need both Raw and Remaking
    return false
  }
  
  const getPhaseRequirement = (phaseType: string) => {
    if (phaseType === 'process' && !hasRawPhase) {
      return 'You must create at least one "Raw" phase before adding a "Remaking" phase'
    }
    if (phaseType === 'masterpiece' && (!hasRawPhase || !hasRemakingPhase)) {
      return 'You must create at least one "Raw" and one "Remaking" phase before adding a "Reveal" phase'
    }
    return null
  }

  const handleLike = async () => {
    if (!currentUserId || isLiking) return
    
    setIsLiking(true)
    try {
      const response = await fetch('/api/projects/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: project?.id })
      })

      if (response?.ok) {
        const newIsLiked = !isLiked
        setIsLiked(newIsLiked)
        setLikeCount(prev => newIsLiked ? prev + 1 : prev - 1)
      } else {
        toast.error('Failed to like project')
      }
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setIsLiking(false)
    }
  }

  const handleShare = async () => {
    try {
      if (navigator?.share) {
        await navigator.share({
          title: project?.title ?? 'Check out this project',
          text: project?.description ?? 'Amazing transformation on Prieelo!',
          url: window?.location?.href
        })
      } else {
        await navigator?.clipboard?.writeText(window?.location?.href ?? '')
        toast.success('Link copied to clipboard!')
      }
    } catch (error) {
      // User cancelled sharing or clipboard failed
    }
  }

  const handlePrivacyToggle = async (newIsPublic: boolean) => {
    if (!isOwner || isUpdatingPrivacy) return

    setIsUpdatingPrivacy(true)
    try {
      const response = await fetch(`/api/projects/${project?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublic: newIsPublic })
      })

      if (response?.ok) {
        setIsPublic(newIsPublic)
        toast.success(`Project is now ${newIsPublic ? 'public' : 'private'}!`)
      } else {
        const error = await response.json()
        toast.error(error?.message || 'Failed to update project privacy')
      }
    } catch (error) {
      console.error('Error updating privacy:', error)
      toast.error('Something went wrong')
    } finally {
      setIsUpdatingPrivacy(false)
    }
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <Badge variant={
                  project?.currentPhase === 'masterpiece' ? 'reveal' :
                  project?.currentPhase === 'process' ? 'remake' : 'raw'
                }>
                  {PHASE_LABELS[project?.currentPhase ?? 'material']}
                </Badge>
                {!isPublic && (
                  <Badge variant="outline">
                    <Lock className="h-3 w-3 mr-1" />
                    Private
                  </Badge>
                )}
                {isPublic && (
                  <Badge variant="outline">
                    <Globe className="h-3 w-3 mr-1" />
                    Public
                  </Badge>
                )}
              </div>
              <h1 className="text-2xl font-bold">{project?.title}</h1>
            </div>
          </div>

          {/* Privacy Toggle for Project Owners */}
          {isOwner && (
            <Card className="p-4">
              <div className="flex items-center space-x-3">
                <Settings className="h-4 w-4 text-muted-foreground" />
                <div className="flex items-center space-x-2">
                  <Label htmlFor="privacy-toggle" className="text-sm font-medium">
                    {isPublic ? 'Public' : 'Private'}
                  </Label>
                  <Switch
                    id="privacy-toggle"
                    checked={isPublic}
                    onCheckedChange={handlePrivacyToggle}
                    disabled={isUpdatingPrivacy}
                    className="data-[state=checked]:bg-green-600"
                  />
                </div>
                <span className="text-xs text-muted-foreground">
                  {isPublic ? 'Visible to everyone' : 'Only visible to you'}
                </span>
              </div>
            </Card>
          )}
        </div>

        {/* Project Info */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={project?.user?.avatar ?? ''} />
                  <AvatarFallback>
                    {project?.user?.username?.charAt(0)?.toUpperCase() ?? 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <Link 
                    href={`/profile/${project?.user?.username}`}
                    className="font-medium hover:underline"
                  >
                    @{project?.user?.username}
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    {project?.user?.firstName} {project?.user?.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Created {new Date(project?.createdAt ?? Date.now()).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLike}
                  disabled={!currentUserId || isLiking}
                  className={isLiked ? 'text-red-600 hover:text-red-700' : 'hover:text-red-600'}
                >
                  <Heart className={`h-4 w-4 mr-1 ${isLiked ? 'fill-current' : ''}`} />
                  {likeCount}
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="hover:text-blue-600"
                  onClick={() => {
                    // Scroll to comments section
                    const commentsSection = document.getElementById('comments-section');
                    if (commentsSection) {
                      commentsSection.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                >
                  <MessageCircle className="h-4 w-4 mr-1" />
                  {project?._count?.comments ?? 0}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShare}
                  className="hover:text-green-600"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {project?.description && (
              <div>
                <Separator className="my-4" />
                <p className="text-muted-foreground">{project.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Project Phases */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Transformation Journey</h2>
          
          <div className="space-y-8">
            {phases.map((phaseType) => {
              const phasePosts = project?.phases?.filter(p => p?.phaseType === phaseType) ?? []
              const isCompleted = project?.currentPhase === 'masterpiece' || 
                (project?.currentPhase === 'process' && phaseType === 'material') ||
                (project?.currentPhase === phaseType)

              return (
                <motion.div
                  key={phaseType}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: phases.indexOf(phaseType) * 0.1 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold flex items-center space-x-2">
                      <span>{PHASE_LABELS[phaseType]}</span>
                      {isCompleted && (
                        <Badge variant="default" className="bg-green-600">
                          Active Phase
                        </Badge>
                      )}
                    </h3>
                    {isOwner && (
                      <>
                        {canAddPhase(phaseType) ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/projects/${project?.id}/add-post?phase=${phaseType}`)}
                          >
                            <div className="h-4 w-4 mr-2">+</div>
                            Add Post
                          </Button>
                        ) : (
                          <div className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              disabled
                              className="mb-1"
                            >
                              <div className="h-4 w-4 mr-2">+</div>
                              Add Post
                            </Button>
                            <p className="text-xs text-muted-foreground max-w-[200px]">
                              {getPhaseRequirement(phaseType)}
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  
                  {phasePosts.length > 0 ? (
                    <div className="grid gap-6">
                      {phasePosts.map((post) => (
                        <PostCard
                          key={post.id}
                          post={{
                            ...post,
                            project: {
                              id: project?.id || '',
                              title: project?.title || '',
                              description: project?.description || '',
                              userId: project?.userId || '',
                              user: {
                                id: project?.user?.id || '',
                                username: project?.user?.username || '',
                                firstName: project?.user?.firstName || '',
                                lastName: project?.user?.lastName || '',
                                avatar: project?.user?.avatar || ''
                              },
                              _count: project?._count || { likes: 0, comments: 0 },
                              likes: project?.likes || []
                            }
                          }}
                          showEdit={true}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                      <div 
                        className={`mx-auto h-12 w-12 rounded-full flex items-center justify-center mb-4 ${
                          phaseType === 'material' ? 'bg-[#3193d0]' : 
                          phaseType === 'process' ? 'bg-[#4a9a8a]' : 
                          'bg-[#5e8764]'
                        }`}
                      >
                        <div className="h-6 w-6 text-white">
                          {phaseType === 'material' ? '📦' : 
                           phaseType === 'process' ? '🔧' : 
                           '✨'}
                        </div>
                      </div>
                      <h4 className="text-sm font-medium mb-2">No posts yet for {PHASE_LABELS[phaseType]}</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        {phaseType === 'material' && "Start by showing the materials you're transforming"}
                        {phaseType === 'process' && "Document your transformation process"}
                        {phaseType === 'masterpiece' && "Show off your finished creation"}
                      </p>
                      {isOwner && (
                        <>
                          {canAddPhase(phaseType) ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/projects/${project?.id}/add-post?phase=${phaseType}`)}
                            >
                              <div className="h-4 w-4 mr-2">+</div>
                              Add First Post
                            </Button>
                          ) : (
                            <div className="text-center">
                              <Button
                                variant="outline"
                                size="sm"
                                disabled
                                className="mb-2"
                              >
                                <div className="h-4 w-4 mr-2">+</div>
                                Add First Post
                              </Button>
                              <p className="text-xs text-muted-foreground">
                                {getPhaseRequirement(phaseType)}
                              </p>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* Comments Section Placeholder */}
        <Card id="comments-section">
          <CardHeader>
            <CardTitle>Comments ({project?._count?.comments ?? 0})</CardTitle>
          </CardHeader>
          <CardContent>
            {project?.comments && project.comments.length > 0 ? (
              <div className="space-y-4">
                {project.comments.map((comment) => (
                  <div key={comment?.id} className="flex space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={comment?.user?.avatar ?? ''} />
                      <AvatarFallback className="text-xs">
                        {comment?.user?.username?.charAt(0)?.toUpperCase() ?? 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <Link
                          href={`/profile/${comment?.user?.username}`}
                          className="font-medium text-sm hover:underline"
                        >
                          @{comment?.user?.username}
                        </Link>
                        <span className="text-xs text-muted-foreground">
                          {new Date(comment?.createdAt ?? Date.now()).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm mt-1">{comment?.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                No comments yet. Be the first to share your thoughts!
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
